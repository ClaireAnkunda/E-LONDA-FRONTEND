# Adding Background Images

## To Use a Local Image

1. Place your image file in the `frontend/public/images/` directory
   - Recommended formats: `.jpg`, `.png`, `.webp`
   - Recommended size: 1920x1080 or larger
   - File name example: `african-students.jpg`

2. Update `HomePage.tsx` line ~13:
   ```tsx
   backgroundImage: 'url(/images/african-students.jpg)',
   ```

## Image Requirements

- **Subject**: African university students in a campus setting
- **Quality**: High resolution, clear, professional
- **Aspect Ratio**: 16:9 or similar landscape orientation
- **File Size**: Optimized (under 500KB recommended for web)

## Current Setup

The homepage currently uses an Unsplash image as a placeholder. Replace it with your own image following the steps above.









