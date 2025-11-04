import cv2
import numpy as np


def align_with_blank_live(blank_path, filled_path,
                          rows=15, cols=8,
                          aligned_out="aligned_card.jpg"):
    """Align a filled card with the blank template and adjust grid live, with S/s for size."""

    # --- load images ---
    blank = cv2.imread(blank_path)
    filled = cv2.imread(filled_path)
    if blank is None or filled is None:
        raise FileNotFoundError("Blank or filled image not found!")

    # --- align filled to blank using SIFT homography ---
    gray_b = cv2.cvtColor(blank, cv2.COLOR_BGR2GRAY)
    gray_f = cv2.cvtColor(filled, cv2.COLOR_BGR2GRAY)
    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(gray_b, None)
    kp2, des2 = sift.detectAndCompute(gray_f, None)
    flann = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=100))
    matches = flann.knnMatch(des1, des2, k=2)
    good = [m[0] for m in matches if len(m) == 2 and m[0].distance < 0.7 * m[1].distance]

    if len(good) < 8:
        raise RuntimeError(f"Not enough matching points ({len(good)}).")

    src = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, _ = cv2.findHomography(dst, src, cv2.RANSAC, 5.0)
    aligned = cv2.warpPerspective(filled, H, (blank.shape[1], blank.shape[0]))
    cv2.imwrite(aligned_out, aligned)
    print("✅  Aligned card saved ->", aligned_out)

    # --- initial ratios ---
    top_ratio, bottom_ratio = 0.172, 0.085
    left_ratio, right_ratio = 0.245, 0.037
    step = 0.003
    # size scaling factor
    scale_factor = 0.7
    scale_step = 0.02

    # --- draw grid ---
    def draw_grid(img, t, b, l, r, sc):
        h, w = img.shape[:2]
        top = int(t * h)
        bottom = int(b * h)
        left = int(l * w)
        right = int(r * w)
        grid_h = (h - top - bottom) * sc
        grid_w = (w - left - right) * sc

        row_h, col_w = grid_h / rows, grid_w / cols
        cy, cx = h / 2, (left + (w - right)) / 2
        new_top = int(cy - grid_h / 2)
        new_bottom = int(h - (cy + grid_h / 2))
        new_left = int(cx - grid_w / 2)
        new_right = int(w - (cx + grid_w / 2))

        overlay = img.copy()
        for rr in range(rows + 1):
            y = int(new_top + rr * row_h)
            cv2.line(overlay, (new_left, y), (w - new_right, y), (0, 255, 0), 1)
        for cc in range(cols + 1):
            x = int(new_left + cc * col_w)
            cv2.line(overlay, (x, new_top), (x, h - new_bottom), (0, 0, 255), 1)
        return overlay, new_top/h, new_bottom/h, new_left/w, new_right/w

    print("\nControls:")
    print("  w/s = move grid up/down | a/d = move left/right")
    print("  i/k = tighten/loosen vertical span | j/l = tighten/loosen horizontal span")
    print("  S / s = enlarge / shrink entire grid size")
    print("  SPACE = save ratios & quit | ESC = exit without saving\n")

    # --- live interaction ---
    while True:
        overlay, top_ratio, bottom_ratio, left_ratio, right_ratio = draw_grid(
            aligned, top_ratio, bottom_ratio, left_ratio, right_ratio, scale_factor
        )
        vis = overlay.copy()
        cv2.putText(vis,
                    f"t={top_ratio:.3f} b={bottom_ratio:.3f} l={left_ratio:.3f} r={right_ratio:.3f} size={scale_factor:.2f}",
                    (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        cv2.imshow("Adjust Grid (press SPACE to save)", vis)
        key = cv2.waitKey(0) & 0xFF

        if key == 27:         # ESC
            break
        elif key == 32:       # SPACE
            with open("grid_ratios.txt", "w") as f:
                f.write(f"{top_ratio:.3f},{bottom_ratio:.3f},{left_ratio:.3f},"
                        f"{right_ratio:.3f},{scale_factor:.3f}")
            print(f"Saved ratios -> grid_ratios.txt : "
                  f"{top_ratio:.3f},{bottom_ratio:.3f},{left_ratio:.3f},"
                  f"{right_ratio:.3f},{scale_factor:.3f}")
            break
        elif key == ord('w'):
            top_ratio += step
        elif key == ord('s'):
            top_ratio -= step
        elif key == ord('i'):
            bottom_ratio += step
        elif key == ord('k'):
            bottom_ratio -= step
        elif key == ord('a'):
            left_ratio += step
        elif key == ord('d'):
            left_ratio -= step
        elif key == ord('j'):
            right_ratio += step
        elif key == ord('l'):
            right_ratio -= step
        # elif key == ord('p'):          # enlarge grid
        #     scale_factor *= (1.0 + scale_step)
        elif key == ord('P'):          # shrink grid
            scale_factor /= (1.0 + scale_step)

    cv2.destroyAllWindows()


# --- run ---
if __name__ == "__main__":
    BLANK = "blankImage.jpeg"
    FILLED = "m2.jpeg"
    align_with_blank_live(BLANK, FILLED)