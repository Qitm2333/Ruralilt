const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = 'E:\\AndroidProjects\\FinalApp\\verifyNew';
const targetDir = 'E:\\AndroidProjects\\FinalApp\\public\\detectCard';

async function processImages() {
  for (let i = 1; i <= 5; i++) {
    const sourcePath = path.join(sourceDir, `${i}-1.png`);
    const targetPath = path.join(targetDir, `${i}.png`);
    
    console.log(`处理 ${i}.png...`);
    
    // 读取图片
    const image = sharp(sourcePath);
    const metadata = await image.metadata();
    
    console.log(`  原始尺寸: ${metadata.width}x${metadata.height}`);
    
    // 计算黄框位置（屏幕中心，280x380）
    const frameWidth = 280;
    const frameHeight = 380;
    
    const centerX = Math.floor(metadata.width / 2);
    const centerY = Math.floor(metadata.height / 2);
    
    const left = centerX - Math.floor(frameWidth / 2);
    const top = centerY - Math.floor(frameHeight / 2);
    
    console.log(`  裁剪区域: (${left}, ${top}, ${frameWidth}, ${frameHeight})`);
    
    // 裁剪黄框区域
    await image
      .extract({
        left: left,
        top: top,
        width: frameWidth,
        height: frameHeight
      })
      .toFile(targetPath);
    
    console.log(`✅ 保存到 ${targetPath}`);
  }
  
  console.log('🎉 所有图片处理完成！');
}

processImages().catch(console.error);
