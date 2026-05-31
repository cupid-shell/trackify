$source = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class LogoGenerator {
    public static void Generate(string path, int size) {
        using (Bitmap bmp = new Bitmap(size, size)) {
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.Clear(Color.Transparent);
                
                float s = size / 512.0f;
                float lr = 32.0f * s; // Corner radius
                
                // Draw Bar 1 (Mint 40%)
                using (GraphicsPath path1 = new GraphicsPath()) {
                    RectangleF r1 = new RectangleF(80f * s, 280f * s, 64f * s, 152f * s);
                    path1.AddArc(r1.X, r1.Y, lr * 2, lr * 2, 180, 90);
                    path1.AddArc(r1.Right - lr * 2, r1.Y, lr * 2, lr * 2, 270, 90);
                    path1.AddArc(r1.Right - lr * 2, r1.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    path1.AddArc(r1.X, r1.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    path1.CloseAllFigures();
                    using (SolidBrush brush1 = new SolidBrush(Color.FromArgb((int)(255 * 0.4f), 16, 185, 129))) {
                        g.FillPath(brush1, path1);
                    }
                }
                
                // Draw Bar 2 (Mint 60%)
                using (GraphicsPath path2 = new GraphicsPath()) {
                    RectangleF r2 = new RectangleF(176f * s, 200f * s, 64f * s, 232f * s);
                    path2.AddArc(r2.X, r2.Y, lr * 2, lr * 2, 180, 90);
                    path2.AddArc(r2.Right - lr * 2, r2.Y, lr * 2, lr * 2, 270, 90);
                    path2.AddArc(r2.Right - lr * 2, r2.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    path2.AddArc(r2.X, r2.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    path2.CloseAllFigures();
                    using (SolidBrush brush2 = new SolidBrush(Color.FromArgb((int)(255 * 0.6f), 16, 185, 129))) {
                        g.FillPath(brush2, path2);
                    }
                }
                
                // Draw Bar 3 (Mint 80%)
                using (GraphicsPath path3 = new GraphicsPath()) {
                    RectangleF r3 = new RectangleF(272f * s, 240f * s, 64f * s, 192f * s);
                    path3.AddArc(r3.X, r3.Y, lr * 2, lr * 2, 180, 90);
                    path3.AddArc(r3.Right - lr * 2, r3.Y, lr * 2, lr * 2, 270, 90);
                    path3.AddArc(r3.Right - lr * 2, r3.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    path3.AddArc(r3.X, r3.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    path3.CloseAllFigures();
                    using (SolidBrush brush3 = new SolidBrush(Color.FromArgb((int)(255 * 0.8f), 16, 185, 129))) {
                        g.FillPath(brush3, path3);
                    }
                }
                
                // Draw Bar 4 (Mint 100%)
                using (GraphicsPath path4 = new GraphicsPath()) {
                    RectangleF r4 = new RectangleF(368f * s, 80f * s, 64f * s, 352f * s);
                    path4.AddArc(r4.X, r4.Y, lr * 2, lr * 2, 180, 90);
                    path4.AddArc(r4.Right - lr * 2, r4.Y, lr * 2, lr * 2, 270, 90);
                    path4.AddArc(r4.Right - lr * 2, r4.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    path4.AddArc(r4.X, r4.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    path4.CloseAllFigures();
                    using (SolidBrush brush4 = new SolidBrush(Color.FromArgb(255, 16, 185, 129))) {
                        g.FillPath(brush4, path4);
                    }
                }
            }
            bmp.Save(path, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing

Write-Host "Generating favicon.png (32x32)..."
[LogoGenerator]::Generate("E:/AntiGravity/trackify/public/favicon.png", 32)

Write-Host "Generating apple-touch-icon.png (180x180)..."
[LogoGenerator]::Generate("E:/AntiGravity/trackify/public/apple-touch-icon.png", 180)

Write-Host "Generating pwa-192x192.png (192x192)..."
[LogoGenerator]::Generate("E:/AntiGravity/trackify/public/pwa-192x192.png", 192)

Write-Host "Generating pwa-512x512.png (512x512)..."
[LogoGenerator]::Generate("E:/AntiGravity/trackify/public/pwa-512x512.png", 512)

Write-Host "Done!"
