/**
 * 折线图绘制类，用于在Canvas上绘制折线图
 * 支持配置多条折线数据、颜色、标题、坐标轴及刻度线
 */
export class LineChart {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private config: LineChartConfig;
	private chartWidth: number;
	private chartHeight: number;
	private padding: { top: number; right: number; bottom: number; left: number };
	private xScale: number;
	private yScale: number;
	private maxYValue: number;
	private minYValue: number;
	private xAxisLabels: string[];
	private yAxisLabels: string[];
	private mouseX: number = -1;
	private mouseY: number = -1;
	private hoveredPointIndex: number = -1;

	/**
	 * 构造函数
	 * @param canvas Canvas元素
	 * @param config 折线图配置
	 */
	constructor(canvas: HTMLCanvasElement, config: LineChartConfig) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
		this.config = config;
		this.padding = {
			top: 40,
			right: 30,
			bottom: 50,
			left: 60,
		};
		this.chartWidth = 
			this.canvas.width - this.padding.left - this.padding.right;
		this.chartHeight = 
			this.canvas.height - this.padding.top - this.padding.bottom;
		this.xScale = 0;
		this.yScale = 0;
		this.maxYValue = 0;
		this.minYValue = 0;
		this.xAxisLabels = [];
		this.yAxisLabels = [];
		this.init();
		
		// 添加鼠标事件监听器
		this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
		this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
	}

	/**
	 * 初始化图表配置
	 */
	private init(): void {
		this.calculateScales();
		this.calculateAxisLabels();
	}

	/**
	 * 计算坐标轴刻度比例
	 */
	private calculateScales(): void {
		// 确保有数据
		if (
			!this.config.data ||
			this.config.data.length === 0 ||
			!this.config.data[0] ||
			!this.config.data[0].values
		) {
			this.maxYValue = 0;
			this.minYValue = 0;
			this.xScale = 0;
			this.yScale = 0;
			return;
		}

		// 计算Y轴的最大最小值
		this.maxYValue = Math.max(
			...this.config.data.map((line) => Math.max(...(line.values || [])))
		);
		this.minYValue = Math.min(
			...this.config.data.map((line) => Math.min(...(line.values || [])))
		);

		// 确保Y轴从0开始
		if (this.minYValue > 0) this.minYValue = 0;

		// 计算X轴和Y轴的刻度比例
		this.xScale = this.chartWidth / (this.config.data[0].values.length - 1);
		this.yScale = this.chartHeight / (this.maxYValue - this.minYValue);
	}

	/**
	 * 计算坐标轴标签
	 */
	private calculateAxisLabels(): void {
		// 确保有数据
		if (!this.config.data || this.config.data.length === 0) return;

		const firstLine = this.config.data[0];
		if (!firstLine || !firstLine.values) return;

		// 计算X轴标签
		if (this.config.xAxis.labelInterval !== undefined) {
			this.xAxisLabels = (this.config.xAxis.labels || []).filter(
				(_, index) => index % (this.config.xAxis.labelInterval ?? 1) === 0
			);
		} else {
			this.xAxisLabels =
				this.config.xAxis.labels ||
				Array.from(
					{ length: firstLine.values.length },
					(_: unknown, i: number) => i.toString()
				);
		}

		// 计算Y轴标签
		this.yAxisLabels = [];
		const yTickCount = this.config.yAxis.tickCount || 5;
		const yTickStep = (this.maxYValue - this.minYValue) / yTickCount;

		for (let i = 0; i <= yTickCount; i++) {
			const yValue = this.minYValue + i * yTickStep;
			const formattedValue = yValue.toFixed(
				this.config.yAxis.decimalPlaces || 0
			);
			this.yAxisLabels.push(formattedValue);
		}
	}

	/**
	 * 绘制图表标题
	 */
	private drawTitle(): void {
		if (!this.config.title) return;

		this.ctx.font = `${this.config.title.fontSize || 16}px ${
			this.config.title.fontFamily || "Arial"
		}`;
		this.ctx.fillStyle = this.config.title.color || "#000";
		this.ctx.textAlign = "center";
		this.ctx.fillText(
			this.config.title.text,
			this.canvas.width / 2,
			this.padding.top / 2
		);
	}

	/**
	 * 绘制X轴
	 */
	private drawXAxis(): void {
		const xAxisY = this.canvas.height - this.padding.bottom;

		// 绘制轴线
		this.ctx.beginPath();
		this.ctx.moveTo(this.padding.left, xAxisY);
		this.ctx.lineTo(this.canvas.width - this.padding.right, xAxisY);
		this.ctx.strokeStyle = this.config.xAxis.color || "#333";
		this.ctx.lineWidth = this.config.xAxis.lineWidth || 1;
		this.ctx.stroke();

		// 绘制刻度线和标签
		this.xAxisLabels.forEach((label, index) => {
			const x =
				this.padding.left +
				index * this.xScale * (this.config.xAxis.labelInterval || 1);

			// 绘制刻度线
			this.ctx.beginPath();
			this.ctx.moveTo(x, xAxisY);
			this.ctx.lineTo(x, xAxisY + (this.config.xAxis.tickLength || 5));
			this.ctx.stroke();

			// 绘制标签
			this.ctx.font = `${this.config.xAxis.fontSize || 12}px ${
				this.config.xAxis.fontFamily || "Arial"
			}`;
			this.ctx.fillStyle = this.config.xAxis.color || "#333";
			this.ctx.textAlign = "center";
			this.ctx.fillText(
				label,
				x,
				xAxisY + (this.config.xAxis.tickLength || 5) + 15
			);
		});

		// 绘制X轴标题
		if (this.config.xAxis.title) {
			this.ctx.font = `${this.config.xAxis.title.fontSize || 14}px ${
				this.config.xAxis.title.fontFamily || "Arial"
			}`;
			this.ctx.fillStyle = this.config.xAxis.title.color || "#000";
			this.ctx.textAlign = "center";
			this.ctx.fillText(
				this.config.xAxis.title.text,
				this.canvas.width / 2,
				this.canvas.height - 10
			);
		}
	}

	/**
	 * 绘制Y轴
	 */
	private drawYAxis(): void {
		const yAxisX = this.padding.left;

		// 绘制轴线
		this.ctx.beginPath();
		this.ctx.moveTo(yAxisX, this.padding.top);
		this.ctx.lineTo(yAxisX, this.canvas.height - this.padding.bottom);
		this.ctx.strokeStyle = this.config.yAxis.color || "#333";
		this.ctx.lineWidth = this.config.yAxis.lineWidth || 1;
		this.ctx.stroke();

		// 计算Y轴刻度值
		const yTickCount = this.config.yAxis.tickCount || 5;
		const yTickStep = (this.maxYValue - this.minYValue) / yTickCount;

		// 绘制刻度线和标签
		for (let i = 0; i <= yTickCount; i++) {
			const yValue = this.minYValue + i * yTickStep;
			const y =
				this.canvas.height -
				this.padding.bottom -
				(yValue - this.minYValue) * this.yScale;

			// 绘制刻度线
			this.ctx.beginPath();
			this.ctx.moveTo(yAxisX - (this.config.yAxis.tickLength || 5), y);
			this.ctx.lineTo(yAxisX, y);
			this.ctx.stroke();

			// 绘制标签
			this.ctx.font = `${this.config.yAxis.fontSize || 12}px ${
				this.config.yAxis.fontFamily || "Arial"
			}`;
			this.ctx.fillStyle = this.config.yAxis.color || "#333";
			this.ctx.textAlign = "right";
			this.ctx.fillText(
				yValue.toFixed(this.config.yAxis.decimalPlaces || 1),
				yAxisX - (this.config.yAxis.tickLength || 5) - 5,
				y + 5
			);
		}

		// 绘制Y轴标题
		if (this.config.yAxis.title) {
			this.ctx.save();
			this.ctx.font = `${this.config.yAxis.title.fontSize || 14}px ${
				this.config.yAxis.title.fontFamily || "Arial"
			}`;
			this.ctx.fillStyle = this.config.yAxis.title.color || "#000";
			this.ctx.translate(this.padding.left / 2, this.canvas.height / 2);
			this.ctx.rotate(-Math.PI / 2);
			this.ctx.textAlign = "center";
			this.ctx.fillText(this.config.yAxis.title.text, 0, 0);
			this.ctx.restore();
		}
	}

	/**
	 * 绘制折线图网格
	 */
	private drawGrid(): void {
		// 确保有数据
		if (!this.config.data || this.config.data.length === 0) return;

		const firstLine = this.config.data[0];
		if (!firstLine || !firstLine.values) return;

		// 绘制垂直网格线
		for (let i = 0; i < firstLine.values.length; i++) {
			const x = this.padding.left + i * this.xScale;

			this.ctx.beginPath();
			this.ctx.moveTo(x, this.padding.top);
			this.ctx.lineTo(x, this.canvas.height - this.padding.bottom);
			this.ctx.strokeStyle = this.config.grid?.color || "#f0f0f0";
			this.ctx.lineWidth = this.config.grid?.lineWidth || 1;
			this.ctx.setLineDash(this.config.grid?.dashed ? [5, 5] : []);
			this.ctx.stroke();
		}

		// 绘制水平网格线
		const yTickCount = this.config.yAxis.tickCount || 5;
		const yTickStep = (this.maxYValue - this.minYValue) / yTickCount;

		for (let i = 0; i <= yTickCount; i++) {
			const yValue = this.minYValue + i * yTickStep;
			const y =
				this.canvas.height -
				this.padding.bottom -
				(yValue - this.minYValue) * this.yScale;

			this.ctx.beginPath();
			this.ctx.moveTo(this.padding.left, y);
			this.ctx.lineTo(this.canvas.width - this.padding.right, y);
			this.ctx.strokeStyle = this.config.grid?.color || "#f0f0f0";
			this.ctx.lineWidth = this.config.grid?.lineWidth || 1;
			this.ctx.setLineDash(this.config.grid?.dashed ? [5, 5] : []);
			this.ctx.stroke();
		}

		// 重置虚线样式
		this.ctx.setLineDash([]);
	}

	/**
	 * 绘制折线
	 */
	private drawLines(): void {
		this.config.data.forEach((line) => {
			this.ctx.beginPath();
			this.ctx.strokeStyle = line.color || "#000";
			this.ctx.lineWidth = line.lineWidth || 2;
			this.ctx.lineCap = "round";
			this.ctx.lineJoin = "round";

			// 绘制折线
			line.values.forEach((value, index) => {
				const x = this.padding.left + index * this.xScale;
				const y =
					this.canvas.height -
					this.padding.bottom -
					(value - this.minYValue) * this.yScale;

				if (index === 0) {
					this.ctx.moveTo(x, y);
				} else {
					this.ctx.lineTo(x, y);
				}
			});

			this.ctx.stroke();

			// 绘制数据点
			if (line.showPoints) {
				line.values.forEach((value, index) => {
					const x = this.padding.left + index * this.xScale;
					const y =
						this.canvas.height -
						this.padding.bottom -
						(value - this.minYValue) * this.yScale;

					this.ctx.beginPath();
					this.ctx.arc(x, y, line.pointRadius || 3, 0, Math.PI * 2);
					this.ctx.fillStyle = line.color || "#000";
					this.ctx.fill();
					this.ctx.strokeStyle = "#fff";
					this.ctx.lineWidth = 1;
					this.ctx.stroke();
				});
			}
		});
	}

	/**
	 * 绘制图例
	 */
	private drawLegend(): void {
		if (!this.config.legend || !this.config.legend.enabled) return;

		const legendItemHeight = 20;
		const legend = this.config.legend;
		const position = legend.position || 'top-right';
		
		// 计算标题高度
		let titleHeight = 0;
		if (this.config.title) {
			this.ctx.font = `${this.config.title.fontSize || 16}px ${this.config.title.fontFamily || "Arial"}`;
			const titleMetrics = this.ctx.measureText(this.config.title.text);
			titleHeight = titleMetrics.actualBoundingBoxAscent + titleMetrics.actualBoundingBoxDescent;
		}
		
		// 标题底部位置
		const titleBottom = this.padding.top / 2 + titleHeight;
		
		// 图例所需的总高度
		const legendTotalHeight = this.config.data.length * legendItemHeight;
		
		// 折线图顶部位置
		const chartTop = this.padding.top;
		
		// 图例最大可用高度（标题底部到折线图顶部之间的距离减去20px的边距）
		const availableHeight = chartTop - titleBottom - 20;
		
		// 如果可用高度足够容纳图例，则将图例放在标题下方10px
		// 否则，将图例放在折线图顶部上方10px
		let legendY = 0;
		if (availableHeight >= legendTotalHeight) {
			legendY = titleBottom + 10;
		} else {
			legendY = chartTop - legendTotalHeight - 10;
		}
		
		// 确保图例位置不低于0
		legendY = Math.max(legendY, 0);
		
		// 计算图例水平位置
		let legendX = 0;
		let textAlign: CanvasTextAlign = 'right';
		
		switch (position) {
			case 'top-left':
				legendX = this.padding.left;
				textAlign = 'left';
				break;
			case 'top-center':
				legendX = this.canvas.width / 2;
				textAlign = 'center';
				break;
			case 'top-right':
				legendX = this.canvas.width - this.padding.right;
				textAlign = 'right';
				break;
		}

		this.config.data.forEach((line, index) => {
			const itemY = legendY + index * legendItemHeight;

			// 绘制图例标记
			this.ctx.beginPath();
			let markerX = 0;
			
			if (textAlign === 'left') {
				markerX = legendX + 5;
				this.ctx.moveTo(markerX, itemY + 5);
				this.ctx.lineTo(markerX + 10, itemY + 5);
			} else if (textAlign === 'center') {
				markerX = legendX - 5;
				this.ctx.moveTo(markerX - 5, itemY + 5);
				this.ctx.lineTo(markerX + 5, itemY + 5);
			} else {
				markerX = legendX - 15;
				this.ctx.moveTo(markerX, itemY + 5);
				this.ctx.lineTo(markerX + 10, itemY + 5);
			}
			
			this.ctx.strokeStyle = line.color || "#000";
			this.ctx.lineWidth = line.lineWidth || 2;
			this.ctx.stroke();

			// 绘制图例文字
			this.ctx.font = `${legend.fontSize || 12}px ${legend.fontFamily || "Arial"}`;
			this.ctx.fillStyle = legend.color || "#333";
			this.ctx.textAlign = textAlign;
			
			if (textAlign === 'left') {
				this.ctx.fillText(line.label, markerX + 15, itemY + 10);
			} else if (textAlign === 'center') {
				this.ctx.fillText(line.label, markerX + 15, itemY + 10);
			} else {
				this.ctx.fillText(line.label, markerX - 5, itemY + 10);
			}
		});
	}

	/**
	 * 绘制完整的折线图
	 */
	public draw(): void {
		// 清空画布
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// 绘制网格
		this.drawGrid();

		// 绘制X轴
		this.drawXAxis();

		// 绘制Y轴
		this.drawYAxis();

		// 绘制标题
		this.drawTitle();

		// 绘制图例
		this.drawLegend();

		// 绘制折线
		this.drawLines();
		
		// 绘制跟踪线和tooltip
		if (this.hoveredPointIndex !== -1) {
			this.drawCrosshair();
			this.drawTooltip();
		}
	}

	/**
	 * 更新折线图数据
	 * @param data 新的折线图数据
	 */
	public updateData(data: LineChartLine[]): void {
		this.config.data = data;
		this.init();
		this.draw();
	}

	/**
	 * 处理鼠标移动事件
	 * @param event 鼠标事件
	 */
	private handleMouseMove(event: MouseEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseX = event.clientX - rect.left;
		this.mouseY = event.clientY - rect.top;
		
		// 计算最近的数据点索引
		this.hoveredPointIndex = this.calculateHoveredPointIndex();
		
		// 重新绘制图表
		this.draw();
	}
	
	/**
	 * 处理鼠标离开事件
	 */
	private handleMouseLeave(): void {
		this.mouseX = -1;
		this.mouseY = -1;
		this.hoveredPointIndex = -1;
		
		// 重新绘制图表
		this.draw();
	}
	
	/**
	 * 计算最近的数据点索引
	 * @returns 最近的数据点索引，如果没有数据则返回-1
	 */
	private calculateHoveredPointIndex(): number {
		if (!this.config.data || this.config.data.length === 0 || !this.config.data[0] || !this.config.data[0].values) {
			return -1;
		}
		
		const pointCount = this.config.data[0].values.length;
		if (pointCount === 0) {
			return -1;
		}
		
		// 计算鼠标在图表区域内的X坐标
		const chartMouseX = this.mouseX - this.padding.left;
		
		// 确保鼠标在图表区域内
		if (chartMouseX < 0 || chartMouseX > this.chartWidth) {
			return -1;
		}
		
		// 计算最近的数据点索引
		const index = Math.round(chartMouseX / this.xScale);
		
		// 确保索引在有效范围内
		return Math.max(0, Math.min(index, pointCount - 1));
	}
	
	/**
	 * 绘制跟踪线
	 */
	private drawCrosshair(): void {
		if (this.hoveredPointIndex === -1) {
			return;
		}
		
		// 计算跟踪线的X坐标
		const crosshairX = this.padding.left + this.hoveredPointIndex * this.xScale;
		
		// 绘制垂直跟踪线
		this.ctx.beginPath();
		this.ctx.moveTo(crosshairX, this.padding.top);
		this.ctx.lineTo(crosshairX, this.canvas.height - this.padding.bottom);
		this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
		this.ctx.lineWidth = 1;
		this.ctx.setLineDash([5, 5]);
		this.ctx.stroke();
		this.ctx.setLineDash([]);
	}
	
	/**
	 * 绘制tooltip
	 */
	private drawTooltip(): void {
		if (this.hoveredPointIndex === -1) {
			return;
		}
		
		// 计算tooltip的位置
		const tooltipX = this.padding.left + this.hoveredPointIndex * this.xScale;
		const tooltipY = this.mouseY;
		
		// 计算tooltip的内容
		const xLabel = this.xAxisLabels[this.hoveredPointIndex % this.xAxisLabels.length];
		const tooltipLines = this.config.data.map((line, index) => {
			const value = line.values[this.hoveredPointIndex];
			const formattedValue = value !== undefined ? value.toFixed(this.config.yAxis.decimalPlaces || 0) : 'N/A';
			return `${line.label}: ${formattedValue}`;
		});
		
		// 计算tooltip的尺寸
		this.ctx.font = '12px Arial';
		const lineHeight = 16;
		const maxLineWidth = Math.max(...tooltipLines.map(line => this.ctx.measureText(line).width));
		const tooltipWidth = maxLineWidth + 16;
		const tooltipHeight = tooltipLines.length * lineHeight + 16;
		
		// 调整tooltip的位置，确保它在画布内
		let adjustedTooltipX = tooltipX;
		let adjustedTooltipY = tooltipY;
		
		if (adjustedTooltipX + tooltipWidth > this.canvas.width) {
			adjustedTooltipX = tooltipX - tooltipWidth;
		}
		
		if (adjustedTooltipY + tooltipHeight > this.canvas.height) {
			adjustedTooltipY = tooltipY - tooltipHeight;
		}
		
		if (adjustedTooltipY < 0) {
			adjustedTooltipY = 0;
		}
		
		// 绘制tooltip背景
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
		this.ctx.strokeStyle = '#ccc';
		this.ctx.lineWidth = 1;
		this.ctx.roundRect(adjustedTooltipX, adjustedTooltipY, tooltipWidth, tooltipHeight, 4);
		this.ctx.fill();
		this.ctx.stroke();
		
		// 绘制tooltip内容
		this.ctx.fillStyle = '#333';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';
		
		tooltipLines.forEach((line, index) => {
			this.ctx.fillText(line, adjustedTooltipX + 8, adjustedTooltipY + 8 + index * lineHeight);
		});
	}
	
	/**
	 * 更新折线图配置
	 * @param config 新的配置
	 */
	public updateConfig(config: Partial<LineChartConfig>): void {
		this.config = { ...this.config, ...config };
		this.init();
		this.draw();
	}
}

/**
 * 折线图配置接口
 */
export interface LineChartConfig {
	/**
	 * 图表标题配置
	 */
	title?: LineChartTitle;

	/**
	 * X轴配置
	 */
	xAxis: LineChartXAxis;

	/**
	 * Y轴配置
	 */
	yAxis: LineChartYAxis;

	/**
	 * 网格配置
	 */
	grid?: LineChartGrid;

	/**
	 * 图例配置
	 */
	legend?: LineChartLegend;

	/**
	 * 折线数据
	 */
	data: LineChartLine[];
}

/**
 * 折线图标题接口
 */
export interface LineChartTitle {
	/**
	 * 标题文本
	 */
	text: string;

	/**
	 * 标题颜色
	 */
	color?: string;

	/**
	 * 标题字体大小
	 */
	fontSize?: number;

	/**
	 * 标题字体
	 */
	fontFamily?: string;
}

/**
 * 折线图坐标轴接口
 */
export interface LineChartAxis {
	/**
	 * 坐标轴标题
	 */
	title?: LineChartTitle;

	/**
	 * 坐标轴颜色
	 */
	color?: string;

	/**
	 * 坐标轴字体大小
	 */
	fontSize?: number;

	/**
	 * 坐标轴字体
	 */
	fontFamily?: string;

	/**
	 * 刻度线长度
	 */
	tickLength?: number;

	/**
	 * 坐标轴线条宽度
	 */
	lineWidth?: number;
}

/**
 * X轴配置接口
 */
export interface LineChartXAxis extends LineChartAxis {
	/**
	 * X轴标签
	 */
	labels: string[];

	/**
	 * X轴标签显示间隔
	 */
	labelInterval?: number;
}

/**
 * Y轴配置接口
 */
export interface LineChartYAxis extends LineChartAxis {
	/**
	 * Y轴刻度数量
	 */
	tickCount?: number;

	/**
	 * Y轴刻度小数位数
	 */
	decimalPlaces?: number;
}

/**
 * 折线图网格接口
 */
export interface LineChartGrid {
	/**
	 * 网格颜色
	 */
	color?: string;

	/**
	 * 网格线条宽度
	 */
	lineWidth?: number;

	/**
	 * 是否显示虚线网格
	 */
	dashed?: boolean;
}

/**
 * 折线图图例接口
 */
export type LegendPosition = 'top-left' | 'top-center' | 'top-right';

export interface LineChartLegend {
	/**
	 * 是否显示图例
	 */
	enabled?: boolean;

	/**
	 * 图例颜色
	 */
	color?: string;

	/**
	 * 图例字体大小
	 */
	fontSize?: number;

	/**
	 * 图例字体
	 */
	fontFamily?: string;

	/**
	 * 图例位置
	 */
	position?: LegendPosition;
}

/**
 * 折线图线条接口
 */
export interface LineChartLine {
	/**
	 * 线条标签
	 */
	label: string;

	/**
	 * 线条数据
	 */
	values: number[];

	/**
	 * 线条颜色
	 */
	color?: string;

	/**
	 * 线条宽度
	 */
	lineWidth?: number;

	/**
	 * 是否显示数据点
	 */
	showPoints?: boolean;

	/**
	 * 数据点半径
	 */
	pointRadius?: number;
}
