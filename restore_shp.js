// Shapefile修复工具 JavaScript实现
// 模拟Python版本的功能，用于演示和教育目的

class ShapefileRestorer {
    constructor() {
        this.files = new Map();
        this.results = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fileUpload = document.getElementById('fileUpload');
        const fileInput = document.getElementById('fileInput');
        const processBtn = document.getElementById('processBtn');
        
        if (!fileUpload || !fileInput || !processBtn) {
            console.error('无法找到必要的DOM元素');
            return;
        }

        // 文件上传区域点击事件
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖拽事件
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 处理按钮事件
        processBtn.addEventListener('click', () => {
            this.processFiles();
        });
    }

    handleFiles(files) {
        const fileList = document.getElementById('fileList');
        const processBtn = document.getElementById('processBtn');
        
        // 清空之前的文件列表
        this.files.clear();
        fileList.innerHTML = '';

        Array.from(files).forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            if (['shp', 'dbf', 'shx', 'prj'].includes(extension)) {
                this.files.set(extension, file);
                this.addFileToList(file, extension);
            }
        });

        // 检查是否有必要的文件
        const hasShp = this.files.has('shp');
        const hasDbf = this.files.has('dbf');
        
        processBtn.disabled = !(hasShp && hasDbf);
        
        if (this.files.size > 0 && (!hasShp || !hasDbf)) {
            this.showMessage('警告：需要同时上传.shp和.dbf文件才能进行修复', 'warning');
        }
    }

    addFileToList(file, extension) {
        const fileList = document.getElementById('fileList');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const icon = this.getFileIcon(extension);
        const size = this.formatFileSize(file.size);
        
        fileInfo.innerHTML = `
            <span class="file-icon">${icon}</span>
            <div>
                <div><strong>${file.name}</strong></div>
                <div style="font-size: 0.9em; color: #666;">${size} • ${extension.toUpperCase()}文件</div>
            </div>
        `;
        
        fileItem.appendChild(fileInfo);
        fileList.appendChild(fileItem);
    }

    getFileIcon(extension) {
        const icons = {
            'shp': '🗺️',
            'dbf': '📊',
            'shx': '📇',
            'prj': '🌐'
        };
        return icons[extension] || '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async processFiles() {
        const processBtn = document.getElementById('processBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const results = document.getElementById('results');
        const resultContent = document.getElementById('resultContent');

        // 开始处理
        processBtn.disabled = true;
        processBtn.textContent = '🔄 正在处理...';
        progressContainer.style.display = 'block';
        results.classList.remove('show');
        this.results = [];

        try {
            // 模拟处理步骤
            await this.simulateProcessing(progressBar);
            
            // 显示结果
            this.displayResults(resultContent);
            results.classList.add('show');
            
        } catch (error) {
            this.showMessage('处理过程中发生错误：' + error.message, 'error');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = '🔧 开始修复文件';
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
        }
    }

    async simulateProcessing(progressBar) {
        const steps = [
            { name: '读取SHP文件头信息', progress: 20 },
            { name: '分析几何数据记录数', progress: 40 },
            { name: '读取DBF属性数据', progress: 60 },
            { name: '比较记录数一致性', progress: 80 },
            { name: '生成修复文件', progress: 100 }
        ];

        for (let step of steps) {
            await this.delay(800); // 模拟处理时间
            progressBar.style.width = step.progress + '%';
            
            // 模拟处理结果
            if (step.progress === 40) {
                await this.analyzeShpFile();
            } else if (step.progress === 60) {
                await this.analyzeDbfFile();
            } else if (step.progress === 80) {
                await this.compareRecords();
            } else if (step.progress === 100) {
                await this.generateResults();
            }
        }
    }

    async analyzeShpFile() {
        const shpFile = this.files.get('shp');
        if (shpFile) {
            try {
                // 真实读取SHP文件记录数
                const arrayBuffer = await this.readFileAsArrayBuffer(shpFile);
                const dataView = new DataView(arrayBuffer);
                
                // 读取文件长度（字节24-27，大端序，以16位字为单位）
                const fileLength = dataView.getUint32(24, false);
                const fileLengthBytes = fileLength * 2;
                
                // 读取几何类型（字节32-35，小端序）
                const shapeType = dataView.getUint32(32, true);
                
                // 计算记录数：从文件头后开始遍历记录
                let recordCount = 0;
                let offset = 100; // SHP文件头固定100字节
                
                while (offset < fileLengthBytes) {
                    if (offset + 8 > fileLengthBytes) break;
                    
                    // 读取记录号（4字节，大端序）
                    const recordNumber = dataView.getUint32(offset, false);
                    // 读取内容长度（4字节，大端序，以16位字为单位）
                    const contentLength = dataView.getUint32(offset + 4, false);
                    
                    recordCount++;
                    offset += 8 + (contentLength * 2); // 记录头8字节 + 内容长度
                }
                
                this.shpRecords = recordCount;
                
                this.results.push({
                    type: 'info',
                    message: `SHP文件分析完成：检测到 ${recordCount} 条几何记录（文件大小：${fileLengthBytes}字节，几何类型：${shapeType}）`
                });
            } catch (error) {
                console.error('读取SHP文件失败:', error);
                this.results.push({
                    type: 'error',
                    message: `SHP文件读取失败：${error.message}`
                });
                this.shpRecords = 0;
            }
        }
    }

    async analyzeDbfFile() {
        const dbfFile = this.files.get('dbf');
        if (dbfFile) {
            try {
                // 真实读取DBF文件记录数
                const arrayBuffer = await this.readFileAsArrayBuffer(dbfFile);
                const dataView = new DataView(arrayBuffer);
                
                // 读取记录数（字节4-7，小端序）
                const recordCount = dataView.getUint32(4, true);
                
                // 读取头部长度（字节8-9，小端序）
                const headerLength = dataView.getUint16(8, true);
                
                // 读取每条记录长度（字节10-11，小端序）
                const recordLength = dataView.getUint16(10, true);
                
                this.dbfRecords = recordCount;
                
                this.results.push({
                    type: 'info',
                    message: `DBF文件分析完成：检测到 ${recordCount} 条属性记录（头部长度：${headerLength}字节，记录长度：${recordLength}字节）`
                });
            } catch (error) {
                console.error('读取DBF文件失败:', error);
                this.results.push({
                    type: 'error',
                    message: `DBF文件读取失败：${error.message}`
                });
                this.dbfRecords = 0;
            }
        }
    }

    async compareRecords() {
        const difference = this.shpRecords - this.dbfRecords;
        
        if (difference === 0) {
            this.results.push({
                type: 'success',
                message: '✅ 几何数据与属性数据记录数一致，无需修复'
            });
            this.needsRepair = false;
        } else if (difference > 0) {
            this.results.push({
                type: 'warning',
                message: `⚠️ SHP文件比DBF文件多 ${difference} 条记录，需要补充属性数据`
            });
            this.needsRepair = true;
            this.repairType = 'add_dbf_records';
        } else {
            this.results.push({
                type: 'warning',
                message: `⚠️ DBF文件比SHP文件多 ${Math.abs(difference)} 条记录，需要删除多余属性数据`
            });
            this.needsRepair = true;
            this.repairType = 'remove_dbf_records';
        }
    }

    async generateResults() {
        if (this.needsRepair) {
            // 生成修复文件
            const baseFileName = this.files.get('shp').name.replace('.shp', '');
            const outputFiles = [
                `${baseFileName}_restore.shp`,
                `${baseFileName}_restore.dbf`,
                `${baseFileName}_restore.shx`
            ];
            
            if (this.files.has('prj')) {
                outputFiles.push(`${baseFileName}_restore.prj`);
            }
            
            this.results.push({
                type: 'success',
                message: `🎉 修复完成！生成文件：${outputFiles.join(', ')}。建议将下载的文件保存到与原始文件相同的目录中。`
            });
            
            // 生成实际的修复文件
            await this.createRepairedFiles(baseFileName);
            
            this.results.push({
                type: 'info',
                message: '📁 修复文件已生成，点击下载按钮获取文件'
            });
        } else {
            this.results.push({
                type: 'info',
                message: '✨ 文件检查完成，无需进行修复操作'
            });
        }
    }

    displayResults(container) {
        container.innerHTML = '';
        
        this.results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const status = document.createElement('span');
            status.className = `status ${result.type}`;
            status.textContent = result.type === 'success' ? '成功' : 
                                result.type === 'warning' ? '警告' : 
                                result.type === 'error' ? '错误' : '信息';
            
            const message = document.createElement('span');
            message.textContent = result.message;
            message.style.marginLeft = '10px';
            
            resultItem.appendChild(status);
            resultItem.appendChild(message);
            container.appendChild(resultItem);
        });
        
        // 添加技术说明
        const techNote = document.createElement('div');
        techNote.style.marginTop = '20px';
        techNote.style.padding = '15px';
        techNote.style.background = '#e8f4fd';
        techNote.style.borderRadius = '8px';
        techNote.style.fontSize = '0.9em';
        techNote.style.color = '#0c5460';
        techNote.innerHTML = `
            <strong>🔧 技术说明：</strong><br>
            • SHP记录数：${this.shpRecords || 'N/A'}<br>
            • DBF记录数：${this.dbfRecords || 'N/A'}<br>
            • 修复方式：${this.getRepairDescription()}
        `;
        container.appendChild(techNote);
    }

    getRepairDescription() {
        if (!this.needsRepair) {
            return '无需修复';
        }
        
        if (this.repairType === 'add_dbf_records') {
            return '向DBF文件添加空记录以匹配SHP记录数';
        } else if (this.repairType === 'remove_dbf_records') {
            return '从DBF文件删除多余记录以匹配SHP记录数';
        }
        
        return '未知修复类型';
    }

    showMessage(message, type = 'info') {
        // 创建临时消息提示
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.maxWidth = '400px';
        messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        const colors = {
            'info': { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' },
            'warning': { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            'error': { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            'success': { bg: '#d4edda', color: '#155724', border: '#c3e6cb' }
        };
        
        const style = colors[type] || colors.info;
        messageDiv.style.backgroundColor = style.bg;
        messageDiv.style.color = style.color;
        messageDiv.style.border = `1px solid ${style.border}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    async createRepairedFiles(baseFileName) {
        try {
            // 读取原始文件内容
            const shpFile = this.files.get('shp');
            const dbfFile = this.files.get('dbf');
            const shxFile = this.files.get('shx');
            const prjFile = this.files.get('prj');
            
            // 创建修复后的文件内容
            if (shpFile) {
                const repairedShpContent = await this.repairShpFile(shpFile);
                this.downloadFile(`${baseFileName}_restore.shp`, repairedShpContent);
            }
            
            if (dbfFile) {
                const repairedDbfContent = await this.repairDbfFile(dbfFile);
                this.downloadFile(`${baseFileName}_restore.dbf`, repairedDbfContent);
            }
            
            if (shxFile) {
                const repairedShxContent = await this.repairShxFile(shxFile);
                this.downloadFile(`${baseFileName}_restore.shx`, repairedShxContent);
            }
            
            if (prjFile) {
                const prjContent = await this.readFileAsArrayBuffer(prjFile);
                this.downloadFile(`${baseFileName}_restore.prj`, prjContent);
            }
            
        } catch (error) {
            console.error('生成修复文件时出错:', error);
            this.showMessage('生成修复文件时出错: ' + error.message, 'error');
        }
    }
    
    async repairShpFile(shpFile) {
        // 读取原始SHP文件
        const arrayBuffer = await this.readFileAsArrayBuffer(shpFile);
        const dataView = new DataView(arrayBuffer);
        
        // 读取SHP文件头信息
        const fileLength = dataView.getUint32(24, false); // 文件长度（大端序，以16位字为单位）
        const shapeType = dataView.getUint32(32, true); // 几何类型（小端序）
        
        console.log(`SHP文件信息: 文件长度=${fileLength * 2}字节, 几何类型=${shapeType}`);
        
        let newArrayBuffer;
        
        if (this.repairType === 'add_dbf_records') {
            // 当需要添加DBF记录时，SHP文件保持不变（因为SHP记录数更多）
            console.log('SHP文件记录数正确，保持不变');
            newArrayBuffer = arrayBuffer.slice();
            
        } else if (this.repairType === 'remove_dbf_records') {
            // 当需要删除DBF记录时，需要删除SHP文件中多余的记录
            const recordsToRemove = this.shpRecords - this.dbfRecords;
            console.log(`需要从SHP文件删除 ${recordsToRemove} 条几何记录`);
            
            if (recordsToRemove > 0) {
                // 需要删除多余的SHP记录
                // 这里需要解析SHP文件结构来正确删除记录
                // 为了简化，我们保持文件不变，实际应用中需要复杂的SHP解析
                console.log('警告：SHP文件记录删除功能需要复杂的几何数据解析，当前保持文件不变');
                newArrayBuffer = arrayBuffer.slice();
            } else {
                newArrayBuffer = arrayBuffer.slice();
            }
            
        } else {
            // 无需修复，直接复制
            newArrayBuffer = arrayBuffer.slice();
        }
        
        return newArrayBuffer;
    }
    
    async repairDbfFile(dbfFile) {
        // 读取原始DBF文件
        const arrayBuffer = await this.readFileAsArrayBuffer(dbfFile);
        const dataView = new DataView(arrayBuffer);
        
        // 读取DBF文件头信息
        const recordCount = dataView.getUint32(4, true); // 记录数（小端序）
        const headerLength = dataView.getUint16(8, true); // 头部长度
        const recordLength = dataView.getUint16(10, true); // 每条记录长度
        
        console.log(`DBF文件信息: 记录数=${recordCount}, 头部长度=${headerLength}, 记录长度=${recordLength}`);
        
        let newArrayBuffer;
        
        if (this.repairType === 'add_dbf_records') {
            // 添加空记录到DBF文件
            const recordsToAdd = this.shpRecords - this.dbfRecords;
            console.log(`需要添加 ${recordsToAdd} 条记录`);
            
            // 计算新文件大小
            const newFileSize = arrayBuffer.byteLength + (recordsToAdd * recordLength);
            newArrayBuffer = new ArrayBuffer(newFileSize);
            const newDataView = new DataView(newArrayBuffer);
            
            // 复制原始头部和现有记录
            const originalData = new Uint8Array(arrayBuffer);
            const newData = new Uint8Array(newArrayBuffer);
            newData.set(originalData);
            
            // 更新记录数
            newDataView.setUint32(4, this.shpRecords, true);
            
            // 添加空记录（用空格填充）
            const recordStartOffset = headerLength + (this.dbfRecords * recordLength);
            for (let i = 0; i < recordsToAdd; i++) {
                const recordOffset = recordStartOffset + (i * recordLength);
                // 第一个字节设为空格（表示有效记录）
                newData[recordOffset] = 0x20; // 空格
                // 其余字节也用空格填充
                for (let j = 1; j < recordLength; j++) {
                    newData[recordOffset + j] = 0x20;
                }
            }
            
        } else if (this.repairType === 'remove_dbf_records') {
            // 从DBF文件删除多余记录
            const recordsToRemove = this.dbfRecords - this.shpRecords;
            console.log(`需要删除 ${recordsToRemove} 条记录`);
            
            // 计算新文件大小
            const newFileSize = arrayBuffer.byteLength - (recordsToRemove * recordLength);
            newArrayBuffer = new ArrayBuffer(newFileSize);
            const newDataView = new DataView(newArrayBuffer);
            
            // 复制头部
            const originalData = new Uint8Array(arrayBuffer);
            const newData = new Uint8Array(newArrayBuffer);
            
            // 复制头部
            newData.set(originalData.subarray(0, headerLength));
            
            // 复制保留的记录
            const recordsToKeep = this.shpRecords;
            const sourceRecordStart = headerLength;
            const targetRecordStart = headerLength;
            
            for (let i = 0; i < recordsToKeep; i++) {
                const sourceOffset = sourceRecordStart + (i * recordLength);
                const targetOffset = targetRecordStart + (i * recordLength);
                newData.set(
                    originalData.subarray(sourceOffset, sourceOffset + recordLength),
                    targetOffset
                );
            }
            
            // 更新记录数
            newDataView.setUint32(4, this.shpRecords, true);
            
        } else {
            // 无需修复，直接复制
            newArrayBuffer = arrayBuffer.slice();
        }
        
        return newArrayBuffer;
    }
    
    async repairShxFile(shxFile) {
        // 读取原始SHX文件
        const arrayBuffer = await this.readFileAsArrayBuffer(shxFile);
        const dataView = new DataView(arrayBuffer);
        
        // 读取SHX文件头信息
        const fileLength = dataView.getUint32(24, false); // 文件长度（大端序，以16位字为单位）
        const currentRecords = (fileLength * 2 - 100) / 8; // 当前记录数
        
        console.log(`SHX文件信息: 当前记录数=${currentRecords}, 目标记录数=${this.shpRecords}`);
        
        let newArrayBuffer;
        
        if (this.repairType === 'add_dbf_records') {
            // 当需要添加DBF记录时，SHX文件保持不变（因为SHP记录数正确）
            console.log('SHX文件索引记录数正确，保持不变');
            newArrayBuffer = arrayBuffer.slice();
            
        } else if (this.repairType === 'remove_dbf_records') {
            // 当需要删除DBF记录时，需要删除SHX文件中多余的索引记录
            const recordsToRemove = currentRecords - this.dbfRecords;
            console.log(`需要删除 ${recordsToRemove} 条SHX索引记录`);
            
            if (recordsToRemove > 0) {
                // 计算新文件大小
                const newFileSize = arrayBuffer.byteLength - (recordsToRemove * 8);
                newArrayBuffer = new ArrayBuffer(newFileSize);
                const newDataView = new DataView(newArrayBuffer);
                
                // 复制头部（100字节）
                const originalData = new Uint8Array(arrayBuffer);
                const newData = new Uint8Array(newArrayBuffer);
                newData.set(originalData.subarray(0, 100));
                
                // 复制保留的索引记录
                const recordsToKeep = this.dbfRecords;
                for (let i = 0; i < recordsToKeep; i++) {
                    const sourceOffset = 100 + (i * 8);
                    const targetOffset = 100 + (i * 8);
                    newData.set(
                        originalData.subarray(sourceOffset, sourceOffset + 8),
                        targetOffset
                    );
                }
                
                // 更新文件长度
                const newFileLengthInWords = newFileSize / 2;
                newDataView.setUint32(24, newFileLengthInWords, false);
            } else {
                newArrayBuffer = arrayBuffer.slice();
            }
            
        } else {
            // 无需修复，直接复制
            newArrayBuffer = arrayBuffer.slice();
        }
        
        return newArrayBuffer;
    }
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
    
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // 显示下载成功消息，提醒用户保存位置
        this.showMessage(`文件 ${filename} 已开始下载，建议保存到与原始文件相同的目录`, 'success');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    try {
        const restorer = new ShapefileRestorer();
        window.shapefileRestorer = restorer;
    } catch (error) {
        console.error('初始化失败:', error);
    }
});

// 添加一些实用的辅助函数
window.ShapefileUtils = {
    // 验证Shapefile完整性
    validateShapefileSet(files) {
        const requiredExtensions = ['shp', 'dbf'];
        const optionalExtensions = ['shx', 'prj'];
        const allExtensions = [...requiredExtensions, ...optionalExtensions];
        
        const fileExtensions = Array.from(files).map(file => 
            file.name.split('.').pop().toLowerCase()
        ).filter(ext => allExtensions.includes(ext));
        
        const hasRequired = requiredExtensions.every(ext => 
            fileExtensions.includes(ext)
        );
        
        return {
            isValid: hasRequired,
            missing: requiredExtensions.filter(ext => !fileExtensions.includes(ext)),
            present: fileExtensions
        };
    },
    
    // 生成下载链接（模拟）
    generateDownloadLink(filename, content) {
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
};