Add-Type -AssemblyName System.Drawing
$path1 = 'c:\Users\Bhavit\OneDrive\Desktop\E-commerce-SaaS-app\public\premium_auth_bg_5.png'
$path2 = 'c:\Users\Bhavit\OneDrive\Desktop\E-commerce-SaaS-app\public\premium_auth_bg_6.png'
$img = [System.Drawing.Image]::FromFile($path1)
$img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone)
$img.Save($path2)
$img.Dispose()
