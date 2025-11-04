import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import tensorflow as tf
from tensorflow.keras import layers, models


MODEL_PATH = os.path.join(os.path.dirname(__file__), "score_symbol_cnn.h5")


def generate_synthetic_symbol_image(symbol: str, image_size: int = 28) -> np.ndarray:
    img = Image.new("L", (image_size, image_size), color=0)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", size=22)
    except Exception:
        font = ImageFont.load_default()

    # ✅ Handle both new and old Pillow versions
    try:
        # For Pillow >= 10.0
        bbox = draw.textbbox((0, 0), symbol, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except AttributeError:
        # For Pillow < 10.0
        w, h = draw.textsize(symbol, font=font)

    draw.text(
        ((image_size - w) / 2, (image_size - h) / 2),
        symbol,
        fill=255,
        font=font,
    )

    arr = np.array(img, dtype=np.uint8)
    return arr

def build_symbol_dataset(num_samples_per_class: int = 500, image_size: int = 28):
    classes = ["hit", "miss"]
    X = []
    y = []

    for _ in range(num_samples_per_class):
        slash = generate_synthetic_symbol_image("/", image_size)
        circ = generate_synthetic_symbol_image("Ø", image_size)
        # Augmentations
        for base in (slash, circ):
            img = base.copy()
            noise = np.random.normal(0, 10, img.shape).astype(np.int16)
            noisy = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            X.append(noisy)
            y.append(0)  # hit

    # Miss class: blanks + random blobs/lines not resembling slash/circle
    for _ in range(num_samples_per_class * 2):
        pil_img = Image.new("L", (image_size, image_size), color=0)
        draw = ImageDraw.Draw(pil_img)
        # Draw random small dots/short lines
        for _ in range(np.random.randint(1, 4)):
            x1, y1 = np.random.randint(0, image_size, size=2)
            x2, y2 = x1 + np.random.randint(-3, 4), y1 + np.random.randint(-3, 4)
            draw.line((int(x1), int(y1), int(x2), int(y2)), fill=255, width=1)
        img = np.array(pil_img, dtype=np.uint8)
        X.append(img)
        y.append(1)  # miss

    X = np.array(X, dtype=np.float32) / 255.0
    X = np.expand_dims(X, -1)
    y = np.array(y, dtype=np.int32)
    idx = np.arange(len(X))
    np.random.shuffle(idx)
    X, y = X[idx], y[idx]
    return X, y, classes


def build_model(image_size: int = 28, num_classes: int = 2) -> models.Model:
    model = models.Sequential([
        layers.Input(shape=(image_size, image_size, 1)),
        layers.Conv2D(16, 3, activation="relu"),
        layers.MaxPooling2D(),
        layers.Conv2D(32, 3, activation="relu"),
        layers.MaxPooling2D(),
        layers.Flatten(),
        layers.Dense(64, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def get_or_train_model(force_retrain: bool = False) -> models.Model:
    if os.path.exists(MODEL_PATH) and not force_retrain:
        try:
            return models.load_model(MODEL_PATH)
        except Exception:
            pass

    X, y, _ = build_symbol_dataset()
    model = build_model()
    model.fit(X, y, epochs=3, batch_size=64, verbose=0, validation_split=0.1)
    model.save(MODEL_PATH)
    return model


def preprocess_roi_for_model(roi_gray: np.ndarray, image_size: int = 28) -> np.ndarray:
    resized = cv2.resize(roi_gray, (image_size, image_size), interpolation=cv2.INTER_AREA)
    norm = resized.astype(np.float32) / 255.0
    return np.expand_dims(norm, axis=(0, -1))


def process_scorecard_tf(image_path: str, show_window: bool = True, force_retrain: bool = False):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image at {image_path}")
        return

    img_visualization = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    bw = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
    )

    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, _ = cv2.findContours(opening, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_contour_area = 100
    score_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]

    scores = {f"Station {i+1}": [] for i in range(15)}

    img_height, img_width = img.shape[:2]
    num_columns = 8
    column_width = img_width // num_columns

    model = get_or_train_model(force_retrain=force_retrain)

    for contour in score_contours:
        x, y, w, h = cv2.boundingRect(contour)
        center_x = x + w // 2
        column_index = center_x // column_width
        if column_index >= 6:
            continue

        roi = gray[y:y + h, x:x + w]
        roi_input = preprocess_roi_for_model(roi)
        probs = model.predict(roi_input, verbose=0)[0]
        # Class indices: 0 = hit, 1 = miss
        predicted_class = int(np.argmax(probs))
        score = 1 if predicted_class == 0 else 0

        station_height = img_height // 16
        station_index = min(y // station_height, 14)
        station_name = f"Station {station_index + 1}"
        scores[station_name].append(score)

        color = (0, 255, 0) if score == 1 else (0, 0, 255)
        cv2.rectangle(img_visualization, (x, y), (x + w, y + h), color, 2)
        cv2.putText(
            img_visualization,
            f"{score}",
            (x, y - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )

    total_score = sum([sum(scores[station]) for station in scores])

    print("Scores by station (excluding row totals and grand total):")
    for station, station_scores in scores.items():
        joined = ", ".join(map(str, station_scores)) if station_scores else "No scores"
        print(f"{station}: {sum(station_scores)} hits ({joined})")
    print(f"\nTotal Score (sum of hits in first 6 columns): {total_score}")

    if show_window:
        cv2.imshow('Scorecard Analysis - TF model (hit=1, miss=0)', img_visualization)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return scores, total_score


if __name__ == "__main__":
    image_path = "/home/infowind/BreakIn_Clays_BE/score_image_02.png"
    scores, total = process_scorecard_tf("m4.jpeg")

