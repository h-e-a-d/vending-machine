# Debug Guide

## Current Status
Debug mode is ENABLED. The application now has extensive logging and visual helpers.

## What to Check in Browser

### 1. Open Browser Console (F12)
Look for these messages:
- `🔍 DEBUG MODE ENABLED`
- `✅ Test cube added at (2, 2, 0)`
- `🏗️ Building vending machine...`
- `📏 Shelf dimensions: ...`
- `🥫 First can position: ...`
- `✅ Vending machine built`
- `📦 Total cans created: XXX` (should be 324)

### 2. Visual Debug Elements
You should see:
- **Axes Helper**: Red (X), Green (Y), Blue (Z) lines
- **Grid Helper**: Ground grid
- **Test Cube**: Bright green cube at position (2, 2, 0)
- **Debug Info Panel**: Top-left corner with FPS, can count, etc.

### 3. Can Visibility Issues
If cans are not visible, check console for:
- Can count (should be 324)
- Scene objects count
- Camera position

### 4. What Changed
- ✅ Cans are now BRIGHT RED with emissive glow
- ✅ Cans are BIGGER (radius doubled from 0.033 to 0.065)
- ✅ Extensive console logging
- ✅ Debug visual helpers
- ✅ FPS counter and stats display

## Expected Console Output

```
🔍 DEBUG MODE ENABLED
✅ Test cube added at (2, 2, 0)
🏗️ Building vending machine...
📏 Shelf dimensions: width=2, depth=0.7
📏 Spacing: X=0.222..., Z=0.116...
📏 Start position: X=-0.888..., Z=-0.15
🥫 First can position: x=-0.888, y=3.694, z=-0.15
✅ Vending machine built
📦 Total cans created: 324
📚 Total shelves: 6
🎯 Scene children: X
```

## If You See the Test Cube But Not Cans
This means Three.js is working, but cans are positioned incorrectly. Check:
1. Can positions in console
2. Camera view (use OrbitControls to rotate)
3. Vending machine group position

## Next Steps
1. Open http://localhost:8000
2. Open browser console
3. Report what you see in console
4. Report what you see visually
