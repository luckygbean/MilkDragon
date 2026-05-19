class ChartComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.padding = { top: 50, right: 50, bottom: 50, left: 50 };
    
    this.currentChart = 'bar';
    this.animationProgress = 0;
    this.animationId = null;
    
    this.hoveredIndex = -1;
    this.mousePosition = { x: 0, y: 0 };
    
    this.registerData = null;
    this.activeData = null;
    
    this.chartModal = document.getElementById('chart-modal');
    this.bindModalEvents();
    
    this.isProcessingClick = false;
    this.isRendering = false;
  }

  bindModalEvents() {
    const closeBtn = document.getElementById('chart-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    this.chartModal.addEventListener('click', (e) => {
      if (e.target === this.chartModal) {
        this.close();
      }
    });
  }

  open() {
    console.log('Chart modal opening');
    this.chartModal.hidden = false;
    
    if (!this.canvas) {
      console.log('Creating canvas for first time');
      this.createCanvas();
      this.createControls();
      this.bindEvents();
    }
    
    this.hoveredIndex = -1;
    
    const tryRender = () => {
      this.resize();
      console.log(`Canvas size: ${this.width} x ${this.height}`);
      
      if (this.width > 0 && this.height > 0) {
        this.currentChart = 'bar';
        document.querySelectorAll('.chart-controls button').forEach(btn => {
          btn.classList.remove('active');
        });
        const barBtn = document.getElementById('chart-btn-bar');
        if (barBtn) barBtn.classList.add('active');
        
        this.animationProgress = 1;
        this.render();
      } else {
        console.log('Canvas dimensions are zero, retrying...');
        requestAnimationFrame(tryRender);
      }
    };
    
    requestAnimationFrame(tryRender);
  }

  close() {
    this.chartModal.hidden = true;
  }

  init() {
    this.createCanvas();
    this.createControls();
    this.bindEvents();
    this.animate();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set default size in case container has no size yet
    this.width = 800;
    this.height = 450;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.container.appendChild(this.canvas);
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'chart-controls';
    
    const buttons = [
      { id: 'bar', label: 'Bar Chart' },
      { id: 'line', label: 'Line Chart' },
      { id: 'pie', label: 'Pie Chart' }
    ];
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.id = `chart-btn-${btn.id}`;
      button.textContent = btn.label;
      button.className = btn.id === this.currentChart ? 'active' : '';
      button.addEventListener('click', () => this.switchChart(btn.id));
      controls.appendChild(button);
    });
    
    this.container.appendChild(controls);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }
  
  handleClick(e) {
    if (this.isProcessingClick) return;
    this.isProcessingClick = true;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    this.mousePosition = { x: mouseX, y: mouseY };
    
    const newHoveredIndex = this.getHoveredIndex();
    console.log('Click position:', mouseX, mouseY, 'New hovered index:', newHoveredIndex, 'Current hovered index:', this.hoveredIndex);
    
    if (this.hoveredIndex === newHoveredIndex) {
      this.hoveredIndex = -1;
    } else {
      this.hoveredIndex = newHoveredIndex;
    }
    
    console.log('Final hovered index:', this.hoveredIndex);
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.animationProgress = 1;
    this.render();
    
    this.isProcessingClick = false;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = (rect.height > 0 ? rect.height - 50 : 450);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    if (this.width > 0 && this.height > 0) {
      this.render();
    }
  }

  switchChart(chartType) {
    this.currentChart = chartType;
    this.animationProgress = 0;
    this.hoveredIndex = -1;
    
    document.querySelectorAll('.chart-controls button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`chart-btn-${chartType}`).classList.add('active');
    
    this.animate();
  }

  animate() {
    console.log('animate called, currentProgress:', this.animationProgress);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    
    if (this.width <= 0 || this.height <= 0) {
      console.log('Cannot animate: canvas dimensions are zero');
      return;
    }
    
    const animate = () => {
      this.animationProgress += 0.05;
      console.log('animationProgress:', this.animationProgress);
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
      }
      
      this.render();
      
      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  render() {
    if (this.isRendering) return;
    this.isRendering = true;
    
    this.clearCanvas();
    
    switch (this.currentChart) {
      case 'bar':
        this.renderBarChart();
        break;
      case 'line':
        this.renderLineChart();
        break;
      case 'pie':
        this.renderPieChart();
        break;
    }
    
    this.renderTooltip();
    
    this.isRendering = false;
  }

  clearCanvas() {
    this.ctx.save();
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#16213e');
    gradient.addColorStop(1, '#1a1a2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.restore();
  }

  renderBarChart() {
    const data = this.getRegisterData();
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    const chartLeft = this.padding.left;
    const chartRight = chartLeft + chartWidth;
    const chartBottom = this.padding.top + chartHeight;
    
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const totalBarWidth = chartWidth / data.dates.length;
    const barWidth = totalBarWidth * 0.6;
    const barGap = (totalBarWidth - barWidth) / 2;
    
    this.drawYAxis(chartHeight, yMax, 'Registered Users');
    this.drawXAxis(data.dates, chartHeight);
    
    for (let index = 0; index < data.dates.length; index++) {
      const x = chartLeft + index * totalBarWidth + barGap;
      
      const value = data.counts[index];
      const barHeight = (value / yMax) * chartHeight * this.animationProgress;
      const y = chartBottom - barHeight;
      
      const isHovered = this.hoveredIndex === index;
      
      this.ctx.save();
      
      this.ctx.beginPath();
      
      const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
      if (isHovered) {
        gradient.addColorStop(0, '#f4d03f');
        gradient.addColorStop(1, '#d4a82f');
        this.ctx.shadowColor = '#f4d03f';
        this.ctx.shadowBlur = 15;
      } else {
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
      }
      this.ctx.fillStyle = gradient;
      
      this.ctx.fillRect(x, y, barWidth, barHeight);
      
      this.ctx.restore();
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.fillStyle = '#f4d03f';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(value.toString(), x + barWidth / 2, y - 8);
      this.ctx.restore();
    }
    
    this.drawTitle('User Registration Statistics (Last 30 Days)');
  }

  renderLineChart() {
    const data = this.getActiveData();
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const pointGap = chartWidth / (data.dates.length - 1);
    
    this.drawYAxis(chartHeight, yMax, 'Active Users');
    this.drawXAxis(data.dates, chartHeight);
    
    const points = data.dates.map((date, index) => ({
      x: this.padding.left + index * pointGap,
      y: this.padding.top + chartHeight - (data.counts[index] / yMax) * chartHeight * this.animationProgress
    }));
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#f4d03f';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const gradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(30, 144, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(15, 52, 96, 0)');
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, this.padding.top + chartHeight);
    
    const drawProgress = Math.floor(points.length * this.animationProgress);
    for (let i = 0; i <= drawProgress && i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (drawProgress > 0 && drawProgress < points.length) {
      const current = points[drawProgress];
      const prev = points[drawProgress - 1];
      const partial = (this.animationProgress * points.length) % 1;
      const interpX = prev.x + (current.x - prev.x) * partial;
      const interpY = prev.y + (current.y - prev.y) * partial;
      this.ctx.lineTo(interpX, interpY);
    }
    
    if (this.animationProgress >= 1) {
      this.ctx.lineTo(points[points.length - 1].x, this.padding.top + chartHeight);
      this.ctx.closePath();
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i <= drawProgress && i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
    
    points.forEach((point, index) => {
      if (index > drawProgress) return;
      
      const isHovered = this.hoveredIndex === index;
      
      this.ctx.beginPath();
      this.ctx.fillStyle = isHovered ? '#f4d03f' : '#1e90ff';
      this.ctx.strokeStyle = '#f4d03f';
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.arc(point.x, point.y, isHovered ? 8 : 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
    
    this.drawTrendLine(data.counts, chartWidth, chartHeight, yMax);
    this.drawTitle('User Activity Statistics (Last 30 Days)');
  }

  drawTrendLine(counts, chartWidth, chartHeight, yMax) {
    const n = counts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += counts[i];
      sumXY += i * counts[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const startX = this.padding.left;
    const startY = this.padding.top + chartHeight - (intercept / yMax) * chartHeight;
    const endX = this.padding.left + chartWidth;
    const endY = this.padding.top + chartHeight - ((slope * (n - 1) + intercept) / yMax) * chartHeight;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  renderPieChart() {
    const data = this.getGenderData();
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 3;
    
    let startAngle = -Math.PI / 2;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2 * this.animationProgress;
      const endAngle = startAngle + sliceAngle;
      
      const isHovered = this.hoveredIndex === index;
      const drawRadius = isHovered ? radius + 10 : radius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, drawRadius, startAngle, endAngle);
      this.ctx.closePath();
      
      const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, drawRadius);
      gradient.addColorStop(0, this.lightenColor(item.color, 30));
      gradient.addColorStop(1, item.color);
      this.ctx.fillStyle = gradient;
      
      this.ctx.shadowColor = isHovered ? item.color : 'transparent';
      this.ctx.shadowBlur = isHovered ? 15 : 0;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(midAngle) * (drawRadius * 0.7);
      const labelY = centerY + Math.sin(midAngle) * (drawRadius * 0.7);
      
      const percentage = ((item.value / total) * 100).toFixed(1);
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${percentage}%`, labelX, labelY);
      
      startAngle = endAngle;
    });
    
    this.drawPieLegend(data);
    this.drawTitle('User Gender Distribution');
  }

  drawPieLegend(data) {
    const legendX = this.width - this.padding.right - 80;
    const legendY = this.padding.top + 20;
    const itemHeight = 30;
    
    data.forEach((item, index) => {
      const y = legendY + index * itemHeight;
      const isHovered = this.hoveredIndex === index;
      
      this.ctx.beginPath();
      this.ctx.roundRect(legendX - 20, y - 8, 16, 16, 4);
      this.ctx.fillStyle = isHovered ? this.lightenColor(item.color, 30) : item.color;
      this.ctx.fill();
      
      this.ctx.fillStyle = isHovered ? '#f4d03f' : '#f4d03f';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(item.name, legendX + 5, y + 4);
    });
  }

  drawYAxis(chartHeight, yMax, label) {
    const ySteps = 5;
    const yStep = yMax / ySteps;
    
    this.ctx.strokeStyle = '#f4d03f';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= ySteps; i++) {
      const y = this.padding.top + (chartHeight / ySteps) * i;
      const value = yMax - (yStep * i);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left - 5, y);
      this.ctx.lineTo(this.padding.left, y);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#f4d03f';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(value.toString(), this.padding.left - 10, y + 4);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(this.width - this.padding.right, y);
      this.ctx.strokeStyle = 'rgba(244, 208, 63, 0.2)';
      this.ctx.stroke();
    }
    
    this.ctx.save();
    this.ctx.translate(15, this.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, 0, 0);
    this.ctx.restore();
  }

  drawXAxis(dates, chartHeight) {
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const step = Math.ceil(dates.length / 6);
    
    this.ctx.strokeStyle = '#f4d03f';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding.left, this.padding.top + chartHeight);
    this.ctx.lineTo(this.width - this.padding.right, this.padding.top + chartHeight);
    this.ctx.stroke();
    
    dates.forEach((date, index) => {
      if (index % step !== 0) return;
      
      const x = this.padding.left + (chartWidth / (dates.length - 1)) * index;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding.top + chartHeight);
      this.ctx.lineTo(x, this.padding.top + chartHeight + 5);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#f4d03f';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(date, x, this.padding.top + chartHeight + 20);
    });
  }

  drawTitle(title) {
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.width / 2, 30);
  }

  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  getHoveredIndex() {
    switch (this.currentChart) {
      case 'bar':
        return this.getBarHoveredIndex();
      case 'line':
        return this.getLineHoveredIndex();
      case 'pie':
        return this.getPieHoveredIndex();
      default:
        return -1;
    }
  }

  getBarHoveredIndex() {
    const data = this.getRegisterData();
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    const chartLeft = this.padding.left;
    const chartRight = chartLeft + chartWidth;
    const chartTop = this.padding.top;
    const chartBottom = this.padding.top + chartHeight;
    
    if (this.mousePosition.x < chartLeft || this.mousePosition.x > chartRight ||
        this.mousePosition.y < chartTop || this.mousePosition.y > chartBottom) {
      return -1;
    }
    
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const totalBarWidth = chartWidth / data.dates.length;
    const barWidth = totalBarWidth * 0.6;
    const barGap = (totalBarWidth - barWidth) / 2;
    
    for (let i = 0; i < data.dates.length; i++) {
      const x = chartLeft + i * totalBarWidth + barGap;
      const right = x + barWidth;
      
      const value = data.counts[i];
      const barHeight = (value / yMax) * chartHeight;
      const y = chartBottom - barHeight;
      
      if (this.mousePosition.x >= x && 
          this.mousePosition.x <= right &&
          this.mousePosition.y >= y && 
          this.mousePosition.y <= chartBottom) {
        return i;
      }
    }
    
    return -1;
  }

  getLineHoveredIndex() {
    const data = this.getActiveData();
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const pointGap = chartWidth / (data.dates.length - 1);
    
    for (let i = 0; i < data.dates.length; i++) {
      const x = this.padding.left + i * pointGap;
      const y = this.padding.top + chartHeight - (data.counts[i] / yMax) * chartHeight;
      
      const distance = Math.sqrt(
        Math.pow(this.mousePosition.x - x, 2) + 
        Math.pow(this.mousePosition.y - y, 2)
      );
      
      if (distance < 15) {
        return i;
      }
    }
    
    return -1;
  }

  getPieHoveredIndex() {
    const data = this.getGenderData();
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 3;
    
    let startAngle = -Math.PI / 2;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (data[i].value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      const dx = this.mousePosition.x - centerX;
      const dy = this.mousePosition.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      
      if (distance <= radius + 10 && angle >= startAngle && angle <= endAngle) {
        return i;
      }
      
      startAngle = endAngle;
    }
    
    const legendX = this.width - this.padding.right;
    const legendY = this.padding.top + 20;
    const itemHeight = 30;
    
    for (let i = 0; i < data.length; i++) {
      const y = legendY + i * itemHeight;
      if (this.mousePosition.x >= legendX - 20 && this.mousePosition.x <= legendX + 60 &&
          this.mousePosition.y >= y - 10 && this.mousePosition.y <= y + 10) {
        return i;
      }
    }
    
    return -1;
  }

  renderTooltip() {
    if (this.hoveredIndex === -1) return;
    
    let tooltipContent = '';
    let tooltipX = this.mousePosition.x + 15;
    let tooltipY = this.mousePosition.y - 10;
    
    switch (this.currentChart) {
      case 'bar': {
        const data = this.getRegisterData();
        tooltipContent = `Date: ${data.dates[this.hoveredIndex]}<br>Registered Users: ${data.counts[this.hoveredIndex]}`;
        const chartWidth = this.width - this.padding.left - this.padding.right;
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        const chartBottom = this.padding.top + chartHeight;
        const totalBarWidth = chartWidth / data.dates.length;
        const maxValue = Math.max(...data.counts);
        const yMax = Math.ceil(maxValue / 10) * 10;
        const x = this.padding.left + this.hoveredIndex * totalBarWidth + totalBarWidth / 2;
        const value = data.counts[this.hoveredIndex];
        const barHeight = (value / yMax) * chartHeight;
        tooltipX = x - 75;
        tooltipY = chartBottom - barHeight - 70;
        break;
      }
      case 'line': {
        const data = this.getActiveData();
        tooltipContent = `Date: ${data.dates[this.hoveredIndex]}<br>Active Users: ${data.counts[this.hoveredIndex]}`;
        const chartWidth = this.width - this.padding.left - this.padding.right;
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        const maxValue = Math.max(...data.counts);
        const yMax = Math.ceil(maxValue / 10) * 10;
        const pointGap = chartWidth / (data.dates.length - 1);
        const x = this.padding.left + this.hoveredIndex * pointGap;
        const value = data.counts[this.hoveredIndex];
        const y = this.padding.top + chartHeight - (value / yMax) * chartHeight;
        tooltipX = x - 75;
        tooltipY = y - 70;
        break;
      }
      case 'pie': {
        const data = this.getGenderData();
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percentage = ((data[this.hoveredIndex].value / total) * 100).toFixed(1);
        tooltipContent = `Gender: ${data[this.hoveredIndex].name}<br>Percentage: ${percentage}%<br>Count: ${data[this.hoveredIndex].value}`;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 4;
        let startAngle = -Math.PI / 2;
        let endAngle = startAngle;
        for (let i = 0; i <= this.hoveredIndex; i++) {
          endAngle = startAngle + (data[i].value / total) * 2 * Math.PI;
          if (i === this.hoveredIndex) break;
          startAngle = endAngle;
        }
        const midAngle = (startAngle + endAngle) / 2;
        const x = centerX + Math.cos(midAngle) * radius * 0.8;
        const y = centerY + Math.sin(midAngle) * radius * 0.8;
        tooltipX = x - 75;
        tooltipY = y - 80;
        break;
      }
    }
    
    if (tooltipX + 150 > this.width) {
      tooltipX = this.width - 160;
    }
    if (tooltipX < 10) {
      tooltipX = 10;
    }
    if (tooltipY + 60 > this.height) {
      tooltipY = this.height - 70;
    }
    if (tooltipY < 10) {
      tooltipY = 10;
    }
    
    this.ctx.fillStyle = 'rgba(244, 208, 63, 0.9)';
    this.ctx.roundRect(tooltipX, tooltipY, 150, 60, 6);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    
    const lines = tooltipContent.split('<br>');
    lines.forEach((line, index) => {
      this.ctx.fillText(line, tooltipX + 12, tooltipY + 20 + index * 18);
    });
  }

  getRegisterData() {
    if (this.registerData) {
      return this.registerData;
    }
    
    const dates = [];
    const counts = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${month}-${day}`);
      counts.push(Math.floor(Math.random() * 50) + 10);
    }
    
    this.registerData = { dates, counts };
    return this.registerData;
  }

  getActiveData() {
    if (this.activeData) {
      return this.activeData;
    }
    
    const dates = [];
    const counts = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${month}-${day}`);
      counts.push(Math.floor(Math.random() * 100) + 80);
    }
    
    this.activeData = { dates, counts };
    return this.activeData;
  }

  getGenderData() {
    return [
      { name: 'Male', value: 65, color: '#1e90ff' },
      { name: 'Female', value: 30, color: '#f4d03f' },
      { name: 'Unknown', value: 5, color: '#0f3460' }
    ];
  }
}