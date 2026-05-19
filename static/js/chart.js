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
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.createControls();
    this.bindEvents();
    this.render();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    this.resize();
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
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height - 50;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.render();
  }

  switchChart(chartType) {
    if (this.currentChart === chartType) return;
    
    this.currentChart = chartType;
    this.animationProgress = 0;
    
    document.querySelectorAll('.chart-controls button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`chart-btn-${chartType}`).classList.add('active');
    
    this.animate();
  }

  animate() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    
    const animate = () => {
      this.animationProgress += 0.05;
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
  }

  clearCanvas() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderBarChart() {
    const data = this.getRegisterData();
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const barWidth = chartWidth / data.dates.length * 0.6;
    const barGap = chartWidth / data.dates.length * 0.4;
    
    this.drawYAxis(chartHeight, yMax, 'Registered Users');
    this.drawXAxis(data.dates, chartHeight);
    
    data.dates.forEach((date, index) => {
      const x = this.padding.left + index * (barWidth + barGap) + barGap / 2;
      const value = data.counts[index];
      const barHeight = (value / yMax) * chartHeight * this.animationProgress;
      const y = this.padding.top + chartHeight - barHeight;
      
      const isHovered = this.hoveredIndex === index;
      const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, isHovered ? '#40a9ff' : '#1890ff');
      gradient.addColorStop(1, isHovered ? '#91caff' : '#73d13d');
      
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = isHovered ? '#1890ff' : 'transparent';
      this.ctx.shadowBlur = isHovered ? 10 : 0;
      this.roundRect(x, y, barWidth, barHeight, 4);
      this.ctx.shadowBlur = 0;
      
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(value.toString(), x + barWidth / 2, y - 8);
    });
    
    this.drawTitle('User Registration Statistics (Last 14 Days)');
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
    this.ctx.strokeStyle = '#1890ff';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const gradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0)');
    
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
      this.ctx.fillStyle = isHovered ? '#fff' : '#1890ff';
      this.ctx.strokeStyle = '#1890ff';
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.arc(point.x, point.y, isHovered ? 8 : 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
    
    this.drawTrendLine(data.counts, chartWidth, chartHeight, yMax);
    this.drawTitle('Quest Create Statistics (Last 14 Days)');
  }

  drawLevelLegend() {
    const legendX = this.width - this.padding.right;
    const legendY = this.padding.top + 50;
    const itemHeight = 25;
    const boxSize = 16;

    const levels = [
      { name: 'Novice Knight', color: '#f5a623', range: 'Lv 0-5' },
      { name: 'Veteran Warrior', color: '#e0e0e0', range: 'Lv 6-50' },
      { name: 'Elite Fighter', color: '#5dade2', range: 'Lv 51-75' },
      { name: 'Legendary Hero', color: '#ffd700', range: 'Lv 76+' }
    ];

    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Level Distribution:', legendX - 10, legendY - 10);

    levels.forEach((level, index) => {
      const y = legendY + index * itemHeight;

      this.ctx.beginPath();
      this.ctx.roundRect(legendX - 20, y - 8, boxSize, boxSize, 3);
      this.ctx.fillStyle = level.color;
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '11px sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(level.name, legendX - 30, y + 3);

      this.ctx.fillStyle = '#888888';
      this.ctx.font = '9px sans-serif';
      this.ctx.fillText(level.range, legendX - 30, y + 15);
    });
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
    const data = this.getLevelDistributionData();
    const centerX = this.width / 2;
    const centerY = (this.height + 50) / 2;
    const radius = Math.min(this.width, this.height) / 3;

    const colors = ['#f5a623', '#e0e0e0', '#5dade2', '#ffd700'];

    let startAngle = -Math.PI / 2;
    const total = data.categories.reduce((sum, item) => sum + item.count, 0);

    data.categories.forEach((item, index) => {
      if (item.count === 0) return;
      const sliceAngle = (item.count / total) * Math.PI * 2 * this.animationProgress;
      const endAngle = startAngle + sliceAngle;

      const isHovered = this.hoveredIndex === index;
      const drawRadius = isHovered ? radius + 10 : radius;

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, drawRadius, startAngle, endAngle);
      this.ctx.closePath();

      this.ctx.fillStyle = colors[index % colors.length];
      this.ctx.shadowColor = isHovered ? colors[index % colors.length] : 'transparent';
      this.ctx.shadowBlur = isHovered ? 15 : 0;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(midAngle) * (drawRadius * 0.7);
      const labelY = centerY + Math.sin(midAngle) * (drawRadius * 0.7);

      const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${percentage}%`, labelX, labelY);

      startAngle = endAngle;
    });

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#16213e';
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Total: ${total}`, centerX, centerY - 10);
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('Players', centerX, centerY + 10);

    this.drawLevelLegend(data.categories, colors);
    this.drawTitle('Player Level Distribution');
  }

  drawLevelLegend(data, colors) {
    const legendX = this.width - this.padding.right;
    const legendY = this.padding.top + 20;
    const itemHeight = 30;

    data.forEach((item, index) => {
      const y = legendY + index * itemHeight;
      const isHovered = this.hoveredIndex === index;

      this.ctx.beginPath();
      this.ctx.roundRect(legendX - 20, y - 8, 16, 16, 4);
      this.ctx.fillStyle = isHovered ? this.lightenColor(colors[index % colors.length], 30) : colors[index % colors.length];
      this.ctx.fill();

      this.ctx.fillStyle = isHovered ? '#1890ff' : '#333333';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(item.name, legendX + 5, y + 4);
    });
  }

  drawYAxis(chartHeight, yMax, label) {
    const ySteps = 5;
    const yStep = yMax / ySteps;
    
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= ySteps; i++) {
      const y = this.padding.top + (chartHeight / ySteps) * i;
      const value = yMax - (yStep * i);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left - 5, y);
      this.ctx.lineTo(this.padding.left, y);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(value.toString(), this.padding.left - 10, y + 4);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(this.width - this.padding.right, y);
      this.ctx.strokeStyle = '#f0f0f0';
      this.ctx.stroke();
    }
    
    this.ctx.save();
    this.ctx.translate(15, this.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, 0, 0);
    this.ctx.restore();
  }

  drawXAxis(dates, chartHeight) {
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const step = Math.ceil(dates.length / 6);
    
    this.ctx.strokeStyle = '#ddd';
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
      
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(date, x, this.padding.top + chartHeight + 20);
    });
  }

  drawTitle(title) {
    this.ctx.fillStyle = '#333333';
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

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    this.hoveredIndex = this.getHoveredIndex();
    this.render();
  }

  handleMouseLeave() {
    this.hoveredIndex = -1;
    this.render();
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
    const maxValue = Math.max(...data.counts);
    const yMax = Math.ceil(maxValue / 10) * 10;
    const barWidth = chartWidth / data.dates.length * 0.6;
    const barGap = chartWidth / data.dates.length * 0.4;
    
    for (let i = 0; i < data.dates.length; i++) {
      const x = this.padding.left + i * (barWidth + barGap) + barGap / 2;
      const value = data.counts[i];
      const barHeight = (value / yMax) * chartHeight;
      const y = this.padding.top + chartHeight - barHeight;
      
      if (this.mousePosition.x >= x && this.mousePosition.x <= x + barWidth &&
          this.mousePosition.y >= y && this.mousePosition.y <= y + barHeight) {
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
    const centerY = (this.height + 50) / 2;
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
        break;
      }
      case 'line': {
        const data = this.getActiveData();
        tooltipContent = `Date: ${data.dates[this.hoveredIndex]}<br>Active Users: ${data.counts[this.hoveredIndex]}`;
        break;
      }
      case 'pie': {
        const data = this.getGenderData();
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percentage = ((data[this.hoveredIndex].value / total) * 100).toFixed(1);
        tooltipContent = `Gender: ${data[this.hoveredIndex].name}<br>Percentage: ${percentage}%<br>Count: ${data[this.hoveredIndex].value}`;
        break;
      }
    }
    
    if (tooltipX + 150 > this.width) {
      tooltipX = this.mousePosition.x - 165;
    }
    if (tooltipY + 60 > this.height) {
      tooltipY = this.mousePosition.y - 70;
    }
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.roundRect(tooltipX, tooltipY, 150, 60, 6);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    
    const lines = tooltipContent.split('<br>');
    lines.forEach((line, index) => {
      this.ctx.fillText(line, tooltipX + 12, tooltipY + 20 + index * 18);
    });
  }

  getRegisterData() {
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
    
    return { dates, counts };
  }

  getActiveData() {
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
    
    return { dates, counts };
  }

  getLevelDistributionData() {
    return {
      categories: [
        { name: 'Novice Knight', count: 45 },
        { name: 'Veteran Warrior', count: 30 },
        { name: 'Elite Fighter', count: 15 },
        { name: 'Legendary Hero', count: 10 }
      ],
      total: 100
    };
  }
}