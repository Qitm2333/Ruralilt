const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 图标尺寸配置
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const baseDir = './android/app/src/main/res';
const sourceIcon = './app-icon.png'; // 你的原始图标路径

async function generateIcons() {
  console.log('🎨 开始生成Android图标...\n');

  // 检查源文件是否存在
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ 找不到源图标文件:', sourceIcon);
    console.log('📝 请将你的LOGO保存为: app-icon.png');
    return;
  }

  for (const [folder, size] of Object.entries(sizes)) {
    const targetDir = path.join(baseDir, folder);
    
    // 确保目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 生成方形图标
    const squareOutput = path.join(targetDir, 'ic_launcher.png');
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(squareOutput);
    console.log(`✅ 生成: ${folder}/ic_launcher.png (${size}x${size})`);

    // 生成圆形图标 (裁剪为圆形)
    const roundOutput = path.join(targetDir, 'ic_launcher_round.png');
    const roundSize = size;
    const radius = Math.floor(roundSize / 2);
    
    // 创建圆形蒙版
    const roundedCorners = Buffer.from(
      `<svg><circle cx="${radius}" cy="${radius}" r="${radius}"/></svg>`
    );

    await sharp(sourceIcon)
      .resize(roundSize, roundSize, {
        fit: 'cover',
        position: 'center'
      })
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toFile(roundOutput);
    console.log(`✅ 生成: ${folder}/ic_launcher_round.png (${size}x${size} 圆形)`);
  }

  console.log('\n🎉 所有图标生成完成！');
  console.log('📁 图标位置: android/app/src/main/res/mipmap-*/');
}

generateIcons().catch(err => {
  console.error('❌ 生成图标时出错:', err);
});
