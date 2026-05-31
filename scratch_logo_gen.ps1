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
                
                // Draw background squircle
                float r = size * 0.28f;
                float inset = 1.0f;
                float w = size - (inset * 2);
                
                using (GraphicsPath gp = new GraphicsPath()) {
                    gp.AddArc(inset, inset, r * 2, r * 2, 180, 90);
                    gp.AddArc(inset + w - r * 2, inset, r * 2, r * 2, 270, 90);
                    gp.AddArc(inset + w - r * 2, inset + w - r * 2, r * 2, r * 2, 0, 90);
                    gp.AddArc(inset, inset + w - r * 2, r * 2, r * 2, 90, 90);
                    gp.CloseAllFigures();
                    
                    using (SolidBrush bgBrush = new SolidBrush(ColorTranslator.FromHtml("#0d1915"))) {
                        g.FillPath(bgBrush, gp);
                    }
                    
                    using (Pen borderPen = new Pen(Color.FromArgb(38, 16, 185, 129), 1.5f * (size / 100.0f))) {
                        g.DrawPath(borderPen, gp);
                    }
                }
                
                float s = size / 100.0f;
                float lr = 5.0f * s;
                
                // Draw left bar
                using (GraphicsPath leftPath = new GraphicsPath()) {
                    RectangleF leftRect = new RectangleF(28f * s, 52f * s, 10f * s, 22f * s);
                    leftPath.AddArc(leftRect.X, leftRect.Y, lr * 2, lr * 2, 180, 90);
                    leftPath.AddArc(leftRect.Right - lr * 2, leftRect.Y, lr * 2, lr * 2, 270, 90);
                    leftPath.AddArc(leftRect.Right - lr * 2, leftRect.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    leftPath.AddArc(leftRect.X, leftRect.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    leftPath.CloseAllFigures();
                    using (SolidBrush purpleBrush = new SolidBrush(Color.FromArgb(128, 139, 92, 246))) {
                        g.FillPath(purpleBrush, leftPath);
                    }
                }
                
                // Draw middle bar
                using (GraphicsPath midPath = new GraphicsPath()) {
                    RectangleF midRect = new RectangleF(45f * s, 38f * s, 10f * s, 36f * s);
                    midPath.AddArc(midRect.X, midRect.Y, lr * 2, lr * 2, 180, 90);
                    midPath.AddArc(midRect.Right - lr * 2, midRect.Y, lr * 2, lr * 2, 270, 90);
                    midPath.AddArc(midRect.Right - lr * 2, midRect.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    midPath.AddArc(midRect.X, midRect.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    midPath.CloseAllFigures();
                    using (SolidBrush purpleBrushSolid = new SolidBrush(Color.FromArgb(204, 139, 92, 246))) {
                        g.FillPath(purpleBrushSolid, midPath);
                    }
                }
                
                // Draw right bar
                using (GraphicsPath rightPath = new GraphicsPath()) {
                    RectangleF rightRect = new RectangleF(62f * s, 24f * s, 10f * s, 50f * s);
                    rightPath.AddArc(rightRect.X, rightRect.Y, lr * 2, lr * 2, 180, 90);
                    rightPath.AddArc(rightRect.Right - lr * 2, rightRect.Y, lr * 2, lr * 2, 270, 90);
                    rightPath.AddArc(rightRect.Right - lr * 2, rightRect.Bottom - lr * 2, lr * 2, lr * 2, 0, 90);
                    rightPath.AddArc(rightRect.X, rightRect.Bottom - lr * 2, lr * 2, lr * 2, 90, 90);
                    rightPath.CloseAllFigures();
                    using (SolidBrush mintBrush = new SolidBrush(ColorTranslator.FromHtml("#10b981"))) {
                        g.FillPath(mintBrush, rightPath);
                    }
                }
                
                // Draw bezier trendline
                PointF pStart = new PointF(20f * s, 62f * s);
                PointF pCtrl1 = new PointF(35f * s, 55f * s);
                PointF pCtrl2 = new PointF(50f * s, 35f * s);
                PointF pEnd = new PointF(75f * s, 25f * s);
                
                using (LinearGradientBrush gradBrush = new LinearGradientBrush(pStart, pEnd, ColorTranslator.FromHtml("#8b5cf6"), ColorTranslator.FromHtml("#10b981"))) {
                    using (Pen gradPen = new Pen(gradBrush, 6.5f * s)) {
                        gradPen.StartCap = LineCap.Round;
                        gradPen.EndCap = LineCap.Round;
                        gradPen.LineJoin = LineJoin.Round;
                        g.DrawBezier(gradPen, pStart, pCtrl1, pCtrl2, pEnd);
                    }
                }
                
                // Draw target node
                float circleRadius = 5f * s;
                using (SolidBrush whiteBrush = new SolidBrush(ColorTranslator.FromHtml("#ecfdf5"))) {
                    g.FillEllipse(whiteBrush, 75f * s - circleRadius, 25f * s - circleRadius, circleRadius * 2, circleRadius * 2);
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
