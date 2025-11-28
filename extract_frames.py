from PIL import Image
import os

# 手动提取黄框区域的坐标（通过观察你的截图估算）
source_dir = r'E:\AndroidProjects\FinalApp\verifyNew'
target_dir = r'E:\AndroidProjects\FinalApp\public\detectCard'

# 确保目标目录存在
os.makedirs(target_dir, exist_ok=True)

# 根据你截图观察，黄框大概的位置
# 图片尺寸大约是手机屏幕大小，黄框在中心
frame_configs = [
    # 每张图的具体裁剪区域 (left, top, width, height)
    # 需要根据实际黄框位置调整
    {"file": "1-1.png", "crop": (165, 285, 280, 380)},  # Card 1
    {"file": "2-1.png", "crop": (165, 285, 280, 380)},  # Card 2  
    {"file": "3-1.png", "crop": (165, 285, 280, 380)},  # Card 3
    {"file": "4-1.png", "crop": (165, 285, 280, 380)},  # Card 4
    {"file": "5-1.png", "crop": (165, 285, 280, 380)},  # Card 5
]

for i, config in enumerate(frame_configs, 1):
    source_path = os.path.join(source_dir, config["file"])
    target_path = os.path.join(target_dir, f"{i}.png")
    
    print(f'处理 Card {i} - {config["file"]}...')
    
    if not os.path.exists(source_path):
        print(f'  ❌ 源文件不存在: {source_path}')
        continue
        
    # 打开图片
    img = Image.open(source_path)
    width, height = img.size
    print(f'  原始尺寸: {width}x{height}')
    
    # 裁剪参数
    left, top, crop_width, crop_height = config["crop"]
    
    print(f'  裁剪区域: ({left}, {top}, {crop_width}, {crop_height})')
    
    # 裁剪黄框内的卡片区域
    cropped = img.crop((left, top, left + crop_width, top + crop_height))
    
    # 保存
    cropped.save(target_path, 'PNG', quality=95)
    print(f'  ✅ 保存到: {target_path}')

print('\n🎉 所有卡片参考图提取完成！')
print('现在这些图片包含了相机拍摄的真实特征，应该能准确匹配了。')
