from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/about')
def about():
    return render_template('about.html')

@main_bp.route('/goals')
def goals():
    sdg_goals = [
        {"id": 1,  "title": "无贫穷",            "color": "#E5243B", "icon": "🌍"},
        {"id": 2,  "title": "零饥饿",             "color": "#DDA63A", "icon": "🌾"},
        {"id": 3,  "title": "良好健康与福祉",     "color": "#4C9F38", "icon": "💚"},
        {"id": 4,  "title": "优质教育",           "color": "#C5192D", "icon": "📚"},
        {"id": 5,  "title": "性别平等",           "color": "#FF3A21", "icon": "⚖️"},
        {"id": 6,  "title": "清洁饮水",           "color": "#26BDE2", "icon": "💧"},
        {"id": 7,  "title": "经济适用的清洁能源", "color": "#FCC30B", "icon": "☀️"},
        {"id": 8,  "title": "体面工作和经济增长", "color": "#A21942", "icon": "📈"},
        {"id": 9,  "title": "产业、创新和基础设施","color": "#FD6925", "icon": "🏭"},
        {"id": 10, "title": "减少不平等",         "color": "#DD1367", "icon": "🤝"},
        {"id": 11, "title": "可持续城市和社区",   "color": "#FD9D24", "icon": "🏙️"},
        {"id": 12, "title": "负责任消费和生产",   "color": "#BF8B2E", "icon": "♻️"},
        {"id": 13, "title": "气候行动",           "color": "#3F7E44", "icon": "🌡️"},
        {"id": 14, "title": "水下生物",           "color": "#0A97D9", "icon": "🐋"},
        {"id": 15, "title": "陆地生物",           "color": "#56C02B", "icon": "🌳"},
        {"id": 16, "title": "和平、正义与强大机构","color": "#00689D", "icon": "🕊️"},
        {"id": 17, "title": "促进目标实现的伙伴关系","color": "#19486A","icon": "🌐"},
    ]
    return render_template('goals.html', goals=sdg_goals)
