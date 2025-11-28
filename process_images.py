from PIL import Image
import os

# 源图片目录
source_dir = r'E:\AndroidProjects\FinalApp\verifyNew'
# 目标目录
target_dir = r'E:\AndroidProjects\FinalApp\public\detectCard'

# 确保目标目录存在
os.makedirs(target_dir, exist_ok=True)

# 处理每张图片 - 裁剪黄框区域（相机拍摄的屏幕）
for i in range(1, 6):
    source_path = os.path.join(source_dir, f'{i}-1.png')
    target_path = os.path.join(target_dir, f'{i}.png')
    
    print(f'处理 {i}.png...')
    
    # 打开图片
    img = Image.open(source_path)
    width, height = img.size
    
    print(f'  原始尺寸: {width}x{height}')
    
    # 黄框位置：屏幕中心，280x380
    # 从图片观察，黄框大约在中心位置
    frame_width = 280
    frame_height = 380
    
    # 计算黄框在图片中的位置
    center_x = width // 2
    center_y = height // 2
    
    # 黄框裁剪区域
    left = center_x - frame_width // 2
    top = center_y - frame_height // 2
    right = left + frame_width
    bottom = top + frame_height
    
    print(f'  裁剪区域: ({left}, {top}, {right}, {bottom})')
    
    # 裁剪黄框区域
    cropped = img.crop((left, top, right, bottom))
    
    # 直接使用裁剪的黄框区域，不再缩放（保持原始相机拍摄数据）
    # 如果尺寸不是280x380，则调整
    if cropped.size != (280, 380):
        cropped = cropped.resize((280, 380), Image.Resampling.LANCZOS)
    
    # 保存
    cropped.save(target_path, 'PNG', quality=95)
    print(f'✅ 保存到 {target_path} (尺寸: {cropped.size})')

print('🎉 所有图片处理完成！')
