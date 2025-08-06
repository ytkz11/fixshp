# Shapefile修复工具 🗺️

<video src="https://github.com/ytkz11/fixshp/blob/master/20250806_fixshp.mp4"></video>

一个基于Web的Shapefile文件修复工具，专门用于检测和修复SHP文件中几何数据与属性数据不一致的问题。这个项目展示了如何使用现代Web技术处理GIS数据格式，为GIS开发者和数据分析师提供了一个实用的在线工具。

## 📖 项目背景

Shapefile是GIS领域最常用的矢量数据格式之一，由多个文件组成：
- `.shp` - 存储几何数据
- `.dbf` - 存储属性数据
- `.shx` - 索引文件
- `.prj` - 投影信息

在数据处理过程中，经常会出现几何数据与属性数据记录数不一致的问题，导致数据无法正常使用。

![](https://cdn.jsdelivr.net/gh/ytkz11/picture/imgs202508061650351.png)

传统的解决方案需要使用专业的GIS软件或编写复杂的脚本，而这个工具提供了一个简单易用的Web界面来解决这个问题。

## 🌟 功能特点

- **🔍 智能检测**：自动读取SHP和DBF文件头信息，精确计算记录数
- **🔧 自动修复**：根据检测结果自动添加或删除记录以保持数据一致性
- **📁 多文件支持**：支持.shp、.dbf、.shx、.prj文件的批量处理
- **🎨 现代化界面**：响应式设计，支持拖拽上传，提供直观的用户体验
- **📊 实时反馈**：详细的处理进度和结果展示，包含技术参数信息
- **💾 文件下载**：生成修复后的文件并自动下载

## 🚀 在线演示

访问 [GitHub Pages 演示页面](https://ytkz.tech/fixshp/) 体验在线版本。

## 📁 文件结构

```
fix_shp/
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions自动部署配置
├── index.html          # 主页面 - 用户界面和交互逻辑
├── restore_shp.js      # JavaScript核心逻辑 - 文件解析和修复算法
├── debug.html          # 调试页面 - 开发测试用
├── test.html           # 测试页面 - 功能验证
├── LICENSE             # MIT开源许可证
└── README.md           # 项目说明文档
```

## 🛠️ 本地运行

### 快速开始

1. **克隆仓库**：
```bash
git clone https://github.com/ytkz11/fixshp.git
cd fix_shp
```

2. **启动本地服务器**（由于浏览器安全限制，需要通过HTTP服务器访问）：

```bash
# 方法1：使用Python（推荐）
python -m http.server 8000

# 方法2：使用Node.js
npx serve . -p 8000

# 方法3：使用PHP
php -S localhost:8000
```

3. **访问应用**：在浏览器中打开 `http://localhost:8000`

### 开发环境

- **前端**：纯HTML/CSS/JavaScript，无需构建工具
- **兼容性**：支持现代浏览器（Chrome 60+, Firefox 55+, Safari 12+）
- **依赖**：无外部依赖，可离线运行

## 📤 部署到GitHub Pages

### 方法：通过GitHub网页界面

1. 在GitHub上创建新仓库 `fix_shp`
2. 上传所有文件到仓库
3. 进入仓库设置 → Pages
4. 选择 "Deploy from a branch"
5. 选择 "main" 分支和 "/ (root)" 文件夹
6. 点击 "Save"
7. 等待几分钟后访问 `https://yourusername.github.io/fixshp/`





## 🎯 使用方法

1. **上传文件**：
   - 点击上传区域或拖拽文件
   - 至少需要.shp和.dbf文件
   - 可选择包含.shx和.prj文件

2. **开始处理**：
   - 点击"开始修复文件"按钮
   - 等待处理完成

3. **查看结果**：
   - 查看详细的处理报告
   - 了解文件一致性状态
   - 获取修复建议

## 🔧 技术实现

### 前端技术栈

- **HTML5**：语义化标签，文件拖拽API，现代化页面结构
- **CSS3**：Flexbox布局，CSS Grid，渐变效果，响应式设计
- **JavaScript ES6+**：
  - `FileReader API` - 读取本地文件
  - `ArrayBuffer` 和 `DataView` - 二进制数据处理
  - `Async/Await` - 异步文件处理
  - `Map` 和 `Set` - 高效数据结构

### 核心算法详解

#### 1. SHP文件解析
```javascript
// 读取SHP文件头信息
const fileLength = dataView.getUint32(24, false); // 大端序
const shapeType = dataView.getUint32(32, true);   // 小端序

// 遍历记录计算数量
let recordCount = 0;
let offset = 100; // SHP文件头固定100字节
while (offset < fileLengthBytes) {
    const recordNumber = dataView.getUint32(offset, false);
    const contentLength = dataView.getUint32(offset + 4, false);
    recordCount++;
    offset += 8 + (contentLength * 2);
}
```

#### 2. DBF文件解析
```javascript
// 读取DBF文件头信息
const recordCount = dataView.getUint32(4, true);  // 记录数
const headerLength = dataView.getUint16(8, true); // 头部长度
const recordLength = dataView.getUint16(10, true); // 记录长度
```

#### 3. 文件修复策略

**添加DBF记录**（当SHP记录数 > DBF记录数）：
- 计算需要添加的记录数
- 扩展DBF文件大小
- 添加空记录（用空格0x20填充）
- 更新文件头中的记录数

**删除DBF记录**（当DBF记录数 > SHP记录数）：
- 计算需要删除的记录数
- 截断DBF文件
- 更新文件头中的记录数
- 同步更新SHX索引文件

#### 4. 字节序处理

Shapefile格式混合使用大端序和小端序：
- **大端序**：文件长度、记录号、内容长度
- **小端序**：几何类型、DBF字段信息

```javascript
// 大端序读取
const bigEndianValue = dataView.getUint32(offset, false);
// 小端序读取
const littleEndianValue = dataView.getUint32(offset, true);
```

## ⚠️ 使用说明

### 功能特性

- **真实文件处理**：能够读取和修复实际的Shapefile文件
- **浏览器兼容**：基于现代Web API，支持本地文件处理
- **数据安全**：所有处理都在浏览器本地进行，不上传到服务器
- **格式支持**：完全兼容ESRI Shapefile标准格式

### 技术限制

- **文件大小**：建议处理小于100MB的文件，大文件可能影响浏览器性能
- **复杂几何**：当前版本主要处理记录数不一致问题，不修复几何数据本身
- **浏览器要求**：需要支持FileReader API和ArrayBuffer的现代浏览器

### 最佳实践

1. **备份原文件**：修复前请备份原始文件
2. **完整文件集**：建议上传完整的.shp、.dbf、.shx、.prj文件
3. **验证结果**：修复后请在GIS软件中验证文件完整性

## 📋 支持的文件格式

| 扩展名 | 描述 | 必需 |
|--------|------|------|
| .shp | 几何数据 | ✅ |
| .dbf | 属性数据 | ✅ |
| .shx | 索引文件 | 推荐 |
| .prj | 投影信息 | 可选 |

## 🎯 应用场景

### 适用情况

- **数据迁移**：从不同GIS系统导出的Shapefile数据不一致
- **数据处理错误**：编程处理过程中意外删除或添加了记录
- **文件损坏**：部分文件损坏导致记录数不匹配
- **批量处理**：需要快速检查和修复多个Shapefile文件

### 实际案例

1. **城市规划数据**：地块几何数据与属性数据记录数不一致
2. **环境监测**：传感器位置数据与监测记录数量不匹配
3. **交通网络**：道路几何与属性信息记录数差异
4. **土地利用**：土地分类几何与属性表记录不对应

### 工具优势

- **快速诊断**：几秒钟内识别问题
- **自动修复**：无需手动编辑复杂的二进制文件
- **Web界面**：无需安装专业GIS软件
- **开源免费**：完全开源，可自由使用和修改

## 🚀 未来计划

无

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个工具！

### 问题反馈

如果您遇到问题或有改进建议，请：
- 在GitHub上创建Issue
- 提供详细的问题描述和复现步骤
- 如果可能，请提供示例文件

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- **ESRI**：感谢提供Shapefile格式规范
- **GIS开源社区**：为地理信息系统的发展做出的贡献
- **Web标准组织**：FileReader API和ArrayBuffer等现代Web技术
- **所有贡献者**：感谢每一个提出建议和改进的开发者

## 📚 相关资源

- [ESRI Shapefile技术规范](https://www.esri.com/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/whitepapers/pdfs/shapefile.pdf)
- [DBF文件格式说明](http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm)
- [JavaScript二进制数据处理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [FileReader API文档](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

---

**开发者**: [小白](https://github.com/ytkz11) | **项目地址**: [GitHub](https://github.com/ytkz11/fixshp) | **在线演示**: [GitHub Pages](https://ytkz.tech/fix_shp/)