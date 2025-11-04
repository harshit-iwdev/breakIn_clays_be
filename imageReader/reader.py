import cv2
import numpy as np
import pytesseract

def align_with_blank(blank_path, filled_path,
                     aligned_out="aligned_card.jpg",
                     grid_out="aligned_grid.jpg",
                     rows=15, cols=11):
    """Align filled scorecard with blank template and draw calibrated grid."""

    # ---- Load both images ----
    blank = cv2.imread(blank_path)
    filled = cv2.imread(filled_path)
    if blank is None or filled is None:
        raise FileNotFoundError("Blank or filled image not found!")

    gray_b = cv2.cvtColor(blank, cv2.COLOR_BGR2GRAY)
    gray_f = cv2.cvtColor(filled, cv2.COLOR_BGR2GRAY)

    # ---- Key‑point match between the two cards ----
    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(gray_b, None)
    kp2, des2 = sift.detectAndCompute(gray_f, None)
    matcher = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=100))
    matches = matcher.knnMatch(des1, des2, k=2)
    good = [m[0] for m in matches if len(m)==2 and m[0].distance < 0.7*m[1].distance]

    if len(good) < 8:
        raise RuntimeError(f"Not enough keypoints – only {len(good)} matched")

    src = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, _ = cv2.findHomography(dst, src, cv2.RANSAC, 5.0)
    aligned = cv2.warpPerspective(filled, H, (blank.shape[1], blank.shape[0]))
    cv2.imwrite(aligned_out, aligned)
    print("✅  Aligned image saved:", aligned_out)

    # ---- fixed ratios from your calibration ----
    top_ratio, bottom_ratio = 0.118, 0.085
    left_ratio, right_ratio = 0.134, 0.037

    # ---- compute exact pixel coordinates ----
    h, w = aligned.shape[:2]
    top, bottom = int(top_ratio * h), int(bottom_ratio * h)
    left, right = int(left_ratio * w), int(right_ratio * w)
    grid_h, grid_w = h - top - bottom, w - left - right
    row_h, col_w = grid_h / rows, grid_w / cols

    # ---- draw grid overlay ----
    overlay = aligned.copy()
    for r in range(rows + 1):
        y = int(top + r * row_h)
        cv2.line(overlay, (left, y), (w - right, y), (0, 255, 0), 1)
    for c in range(cols + 1):
        x = int(left + c * col_w)
        cv2.line(overlay, (x, top), (x, h - bottom), (0, 0, 255), 1)

    cv2.imwrite(grid_out, overlay)
    print("✅  Grid image saved:", grid_out)

    return aligned, (top, bottom, left, right, row_h, col_w)



def read_grid_characters(aligned_img, grid_info, rows=15, cols=8):
    """Read each cell inside the grid and return a 2‑D list of detected symbols."""
    top, bottom, left, right, row_h, col_w = grid_info
    h, w = aligned_img.shape[:2]
    gray = cv2.cvtColor(aligned_img, cv2.COLOR_BGR2GRAY)
    results = []

    config = "--psm 10 -c tessedit_char_whitelist=Xx/0Oo"

    for r in range(rows):
        row_vals = []
        y1, y2 = int(top + r * row_h), int(top + (r + 1) * row_h)
        for c in range(cols):
            x1, x2 = int(left + c * col_w), int(left + (c + 1) * col_w)
            cell = gray[y1:y2, x1:x2]
            # clean cell for OCR
            cell = cv2.resize(cell, (0,0), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            blur = cv2.GaussianBlur(cell, (3,3), 0)
            _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            text = pytesseract.image_to_string(th, config=config).strip().upper()
            symbol = text[0] if text else ""     # empty string if nothing detected
            row_vals.append(symbol)
        results.append(row_vals)

    return results




if __name__ == "__main__":
    BLANK = "blankImage.jpeg"
    FILLED = "m2.jpeg"
    aligned, grid_info = align_with_blank(BLANK, FILLED)
    grid_values = read_grid_characters(aligned, grid_info, rows=14, cols=11)

    print("\nDetected grid characters:\n")
    for i, row in enumerate(grid_values, 1):
        print(f"Station {i:02d}: {row}")