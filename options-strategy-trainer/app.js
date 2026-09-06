const THEME_KEY = "ost-theme";
const DEFAULT_THEME = "dark";

function safeGetTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function safeSaveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Local files can still work when browser storage is unavailable.
  }
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  const isDark = nextTheme === "dark";
  const toggle = document.querySelector("#theme-toggle");
  const themeColor = document.querySelector("#theme-color");

  document.documentElement.dataset.theme = nextTheme;
  if (toggle) {
    toggle.setAttribute("aria-label", isDark ? "当前为黑夜模式，点击切换到白天模式" : "当前为白天模式，点击切换到黑夜模式");
    toggle.setAttribute("aria-pressed", String(isDark));
  }
  if (themeColor) themeColor.setAttribute("content", isDark ? "#10171b" : "#f5f7f8");
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || safeGetTheme();
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  safeSaveTheme(nextTheme);
}

const strategies = {
  longCall: {
    name: "买入看涨期权",
    english: "Long Call",
    structure: "买入 ATM 或略 OTM 的 Call。",
    profit: "赚标的快速上涨的钱；IV 上升时，期权变贵也可能帮你赚钱。",
    loss: "亏权利金和时间损耗；标的不涨、涨太慢，或 IV 回落都会拖后腿。",
    expiration: [
      "到期价 ≤ Call 行权价：Call 归零，最大亏损 = 支付的权利金。",
      "到期价高于 Call 行权价：盈亏 = 到期价 - 行权价 - 权利金。",
      "盈亏平衡点 = Call 行权价 + 权利金；再往上就是主要利润来源。"
    ],
    why: "适合强看涨且 IV 偏低时，用有限权利金换取向上凸性。",
    avoid: "IV 已经很高、只小幅看涨，或时间不站在你这边时，不适合裸买 Call。",
    greeks: { Delta: "+", Gamma: "+", Theta: "-", Vega: "+" },
    risk: "Defined risk",
    notes: ["最大亏损是权利金。", "需要方向和时间都配合。", "低 IV 环境更友好。"]
  },
  bullCallSpread: {
    name: "牛市看涨价差",
    english: "Bull Call Debit Spread",
    structure: "买入较低执行价 Call（ATM/略 ITM）+ 卖出较高执行价 OTM Call。",
    profit: "赚价格向目标价上涨的钱；卖出的上方 Call 帮你少付一部分权利金。",
    loss: "亏净支出的权利金；涨不够或涨太慢会被时间损耗吃掉，上方收益也被封顶。",
    expiration: [
      "到期价 ≤ 买入 Call 行权价：最大亏损 = 净支出的权利金。",
      "到期价 ≥ 卖出 Call 行权价：最大盈利 = Spread 宽度 - 净支出的权利金。",
      "中间区间：价格越靠近卖出 Call，利润越接近上限。"
    ],
    why: "适合看涨但不想为高 IV 付太多权利金；也适合 TR 下沿 FBO + Low IV 时，用更便宜的 debit 押价格回到区间内。",
    avoid: "如果你预期会大幅突破上方行权价，价差会限制最大收益。",
    greeks: { Delta: "+", Gamma: "+/0", Theta: "-/0", Vega: "+/0" },
    risk: "Defined risk",
    notes: ["上涨空间被封顶。", "比单买 Call 更抗 IV 回落。", "适合有明确目标价。"]
  },
  bullPutSpread: {
    name: "牛市认沽信用价差",
    english: "Bull Put Credit Spread",
    structure: "卖出较高执行价 OTM Put + 买入更低执行价 OTM Put；这是两条 Put 腿，不用 Call。",
    profit: "赚卖出 Put 收到的权利金，主要来自时间流逝和 IV 回落。",
    loss: "亏价格跌破卖出 Put 后的价差风险；急跌会让短 Gamma 变得很难受。",
    expiration: [
      "到期价 ≥ 卖出 Put 行权价：两个 Put 都归零，保留净权利金 = 最大盈利。",
      "到期价 ≤ 买入 Put 行权价：最大亏损 = Spread 宽度 - 净权利金。",
      "中间区间：盈亏 = 净权利金 - 卖出 Put 的内在价值。"
    ],
    why: "适合温和看涨或不看跌；TR 下沿 FBO + High IV 时，也可以卖下方 Put spread，用丰厚权利金押支撑守住。",
    avoid: "如果你认为标的可能快速跌破卖出 Put，信用价差会很难管理。",
    greeks: { Delta: "+", Gamma: "-", Theta: "+", Vega: "-" },
    risk: "Defined risk",
    notes: ["最大亏损由价差宽度减去权利金决定。", "更像是在卖一个不会跌破的观点。", "高 IV 时权利金更充足。"]
  },
  cashSecuredPut: {
    name: "现金担保卖出认沽",
    english: "Cash-Secured Put",
    structure: "卖出 OTM Put，并预留足够现金准备被指派接货。",
    profit: "赚卖 Put 的权利金和时间价值；如果接货后反弹，也赚正股回升的钱。",
    loss: "亏标的跌破接货价后的正股风险；收到的权利金只能缓冲一部分下跌。",
    expiration: [
      "到期价 ≥ Put 行权价：Put 归零，保留权利金 = 最大期权盈利。",
      "到期价低于 Put 行权价：可能被指派买入正股，实际成本 = 行权价 - 权利金。",
      "若接货后继续下跌，亏损来自正股下跌；权利金只是缓冲垫。"
    ],
    why: "适合看涨或愿意更低价格买入正股，IV 偏高时能收取更厚权利金。",
    avoid: "如果你不愿意接货，或标的基本面可能快速恶化，不该用这个结构。",
    greeks: { Delta: "+", Gamma: "-", Theta: "+", Vega: "-" },
    risk: "Assignment risk",
    notes: ["需要预留足够现金。", "下跌时可能以行权价买入股票。", "更适合你本来就想拥有的标的。"]
  },
  longPut: {
    name: "买入看跌期权",
    english: "Long Put",
    structure: "买入 ATM 或略 OTM 的 Put。",
    profit: "赚标的快速下跌的钱；IV 上升时，Put 变贵也可能帮你赚钱。",
    loss: "亏权利金和时间损耗；不跌、跌太慢，或 IV 回落都会伤害这笔交易。",
    expiration: [
      "到期价 ≥ Put 行权价：Put 归零，最大亏损 = 支付的权利金。",
      "到期价低于 Put 行权价：盈亏 = 行权价 - 到期价 - 权利金。",
      "盈亏平衡点 = Put 行权价 - 权利金；再往下才是真正盈利。"
    ],
    why: "适合强看跌且 IV 偏低时，用有限权利金表达下跌观点。",
    avoid: "IV 高或只是温和看跌时，权利金成本可能吞掉判断优势。",
    greeks: { Delta: "-", Gamma: "+", Theta: "-", Vega: "+" },
    risk: "Defined risk",
    notes: ["最大亏损是权利金。", "方向、速度和时间都重要。", "也可作为短期保护。"]
  },
  bearPutSpread: {
    name: "熊市看跌价差",
    english: "Bear Put Debit Spread",
    structure: "买入较高执行价 Put（ATM/略 ITM）+ 卖出较低执行价 OTM Put。",
    profit: "赚价格下跌到目标区间的钱；卖出的下方 Put 帮你降低成本。",
    loss: "亏净支出的权利金；跌不够或跌太慢会输给时间，暴跌收益也被封顶。",
    expiration: [
      "到期价 ≥ 买入 Put 行权价：最大亏损 = 净支出的权利金。",
      "到期价 ≤ 卖出 Put 行权价：最大盈利 = Spread 宽度 - 净支出的权利金。",
      "中间区间：价格越靠近卖出 Put，利润越接近上限。"
    ],
    why: "适合看跌但希望控制成本；也适合 TR 上沿 FBO + Low IV 时，用更便宜的 debit 押价格回到区间内。",
    avoid: "如果你预期会暴跌，价差会限制下方收益。",
    greeks: { Delta: "-", Gamma: "+/0", Theta: "-/0", Vega: "+/0" },
    risk: "Defined risk",
    notes: ["收益和亏损都被限定。", "适合有明确下跌目标。", "比单买 Put 更抗高 IV。"]
  },
  bearCallSpread: {
    name: "熊市看涨信用价差",
    english: "Bear Call Credit Spread",
    structure: "卖出较低执行价 OTM Call + 买入更高执行价 OTM Call。",
    profit: "赚卖出 Call 收到的权利金，来自时间流逝、IV 回落，以及价格留在卖出 Call 下方。",
    loss: "亏价格突破卖出 Call 后的上方价差风险；急涨会让短 Gamma 变得很痛。",
    expiration: [
      "到期价 ≤ 卖出 Call 行权价：两个 Call 都归零，保留净权利金 = 最大盈利。",
      "到期价 ≥ 买入 Call 行权价：最大亏损 = Spread 宽度 - 净权利金。",
      "中间区间：盈亏 = 净权利金 - 卖出 Call 的内在价值。"
    ],
    why: "适合温和看跌或不看涨；TR 上沿 FBO + High IV 时，也可以卖上方 Call spread，用丰厚权利金押压力守住。",
    avoid: "如果标的可能快速突破卖出 Call，亏损会放大到价差上限。",
    greeks: { Delta: "-", Gamma: "-", Theta: "+", Vega: "-" },
    risk: "Defined risk",
    notes: ["最大亏损由价差宽度减去权利金决定。", "更适合阻力位清晰的场景。", "需要提前设置止损或调整规则。"]
  },
  protectivePut: {
    name: "保护性认沽",
    english: "Protective Put",
    structure: "持有正股 + 买入 ATM 或 OTM Put 做下方保护。",
    profit: "主要不是为了赚期权钱，而是下跌时用 Put 对冲正股亏损；正股继续涨时仍赚正股上涨。",
    loss: "亏保险费和时间损耗；如果没跌，Put 可能慢慢归零。",
    expiration: [
      "到期价 ≥ Put 行权价：Put 归零，正股继续参与上涨，但亏掉保险费。",
      "到期价低于 Put 行权价：Put 增值，帮助抵消正股下跌。",
      "保护底线大致 = Put 行权价 - Put 权利金；本质是给正股买保险。"
    ],
    why: "适合已有正股但担心下跌，用 Put 给仓位加一个明确的下方保护。",
    avoid: "如果 IV 很高且只是轻微担心，保险费可能过贵。",
    greeks: { Delta: "+/0", Gamma: "+", Theta: "-", Vega: "+" },
    risk: "Premium risk",
    notes: ["保护越近，成本越高。", "不改变你持有正股的上行空间。", "适合事件前或趋势破位前。"]
  },
  collar: {
    name: "领口策略",
    english: "Collar",
    structure: "持有正股 + 买入 OTM Put + 卖出 OTM Call。",
    profit: "赚正股在保护区间内上涨的钱；卖 Call 的权利金用来抵消 Put 保险费。",
    loss: "亏保险净成本和正股下跌的剩余风险；大涨时，上方收益会被卖出的 Call 封住。",
    expiration: [
      "到期价 ≥ 卖出 Call 行权价：正股上方收益被封顶，通常在 Call 行权价附近锁定结果。",
      "到期价 ≤ 买入 Put 行权价：Put 提供下方保护，亏损被限制在保护线附近。",
      "中间区间：主要跟随正股涨跌，再扣掉 Put 与 Call 的净成本或净收入。"
    ],
    why: "适合已有正股、想保护下跌，同时愿意卖出上方收益来降低保险成本。",
    avoid: "如果你不愿意牺牲大涨空间，就不适合卖出上方 Call。",
    greeks: { Delta: "+/0", Gamma: "0", Theta: "+/0", Vega: "-/0" },
    risk: "Capped range",
    notes: ["下方有保护，上方收益被封顶。", "常用于保护已有利润。", "Call 收入可抵消 Put 成本。"]
  },
  coveredCall: {
    name: "备兑看涨",
    english: "Covered Call",
    structure: "持有正股 + 卖出 OTM Call。",
    profit: "赚正股小涨或横盘的钱，再加上卖 Call 收到的权利金和时间价值。",
    loss: "亏正股下跌的钱；大涨时，超过行权价的收益让给买 Call 的人。",
    expiration: [
      "到期价 ≤ 卖出 Call 行权价：Call 归零，保留权利金，继续持有正股。",
      "到期价高于卖出 Call 行权价：可能按行权价卖出正股，上方收益被封顶。",
      "最大风险仍来自正股下跌；权利金只能降低一点持仓成本。"
    ],
    why: "适合已有正股、温和看涨或横盘，用卖出 Call 增加收入。",
    avoid: "如果你不愿意在行权价卖出股票，或预期会急涨，不适合备兑。",
    greeks: { Delta: "+", Gamma: "-", Theta: "+", Vega: "-" },
    risk: "Capped upside",
    notes: ["需要持有正股。", "收取权利金但牺牲部分上行。", "IV 高时收入更好。"]
  },
  ironCondor: {
    name: "铁鹰",
    english: "Iron Condor",
    structure: "卖出 OTM Put + 买入更低 OTM Put，同时卖出 OTM Call + 买入更高 OTM Call。",
    profit: "赚上下两侧卖出期权的权利金，主要来自时间流逝和 IV 回落。",
    loss: "亏价格突破区间后的单侧价差风险；大波动和 IV 上升都不利。",
    expiration: [
      "到期价留在卖出 Put 和卖出 Call 之间：四条腿大多归零，保留净权利金 = 最大盈利。",
      "跌破买入 Put 或涨破买入 Call：触发单侧最大亏损 = 单侧价差宽度 - 净权利金。",
      "落在任一卖出腿和保护腿之间：进入部分亏损或小盈利区间。"
    ],
    why: "适合中性观点且 IV 偏高，卖出上下两侧区间来收取时间价值。",
    avoid: "如果你预期会出现单边大波动，铁鹰容易被突破。",
    greeks: { Delta: "0", Gamma: "-", Theta: "+", Vega: "-" },
    risk: "Defined risk",
    notes: ["核心是判断价格会留在区间内。", "风险有限但需要管理突破。", "高 IV 收入更有吸引力。"]
  },
  calendar: {
    name: "日历价差",
    english: "Calendar Spread",
    structure: "同一执行价附近，买入远月 Call/Put + 卖出近月同方向 Call/Put，常放在 ATM 附近。",
    profit: "赚近月期权更快衰减的钱，也可能赚远月 Vega；价格停在中心附近最舒服。",
    loss: "亏价格离开中心太远的钱；期限结构变化或远月 IV 下跌也会伤害远月腿。",
    expiration: [
      "近月到期时价格靠近共同执行价：卖出的近月腿衰减最快，通常是最理想结果。",
      "价格快速远离执行价：远月腿虽然还在，但整体优势会变差。",
      "最终盈亏不只看到期价，还取决于远月剩余时间和远月 IV。"
    ],
    why: "适合中性或温和方向、近月 IV 较高而远月相对合理时，利用时间结构。",
    avoid: "如果价格可能迅速远离中心行权价，日历价差会失去优势。",
    greeks: { Delta: "0/+", Gamma: "-", Theta: "+", Vega: "+" },
    risk: "Defined risk",
    notes: ["更依赖价格停留在附近。", "受期限结构影响明显。", "需要关注近月到期后的处理。"]
  },
  longStraddle: {
    name: "买入跨式",
    english: "Long Straddle",
    structure: "买入 ATM Call + 买入 ATM Put。",
    profit: "赚大波动的钱，不管向上还是向下；IV 上升也有利。",
    loss: "亏双边权利金和时间损耗；如果价格不动，两边期权都会慢慢缩水。",
    expiration: [
      "到期价大幅高于执行价：Call 的内在价值覆盖双边权利金后盈利。",
      "到期价大幅低于执行价：Put 的内在价值覆盖双边权利金后盈利。",
      "到期价留在两个盈亏平衡点之间：波动不够，亏掉部分或全部权利金。"
    ],
    why: "适合 IV 偏低但预期会出现大波动，方向不确定也可以表达波动观点。",
    avoid: "如果 IV 已经很高或预期只是小幅震荡，时间损耗会很重。",
    greeks: { Delta: "0", Gamma: "+", Theta: "-", Vega: "+" },
    risk: "Defined risk",
    notes: ["需要足够大的波动来覆盖权利金。", "方向不重要，幅度很重要。", "事件后 IV 回落是主要风险。"]
  }
};

const payoffDiagrams = {
  longCall: {
    title: "Long Call 到期盈亏",
    path: "M48 162 L132 162 L276 52",
    markers: [
      { type: "loss", x: 74, y: 162, label: "最大亏损 = 支付的权利金", tx: 62, ty: 146, anchor: "start" },
      { type: "strike", x: 132, y: 162, label: "Call 行权价", tx: 132, ty: 190, guide: true },
      { type: "be", x: 190, y: 118, label: "BE", tx: 190, ty: 106 },
      { type: "profit", x: 246, y: 75, label: "价格再往上才是利润", tx: 286, ty: 58, anchor: "end" }
    ]
  },
  bullCallSpread: {
    title: "Bull Call Debit Spread 到期盈亏",
    path: "M48 162 L116 162 L202 72 L282 72",
    priceLabel: { y: 134 },
    markers: [
      { type: "loss", x: 72, y: 162, label: ["最大亏损", "净支出"], tx: 62, ty: 136, anchor: "start" },
      { type: "strike", x: 116, y: 162, label: "买入较低 Call", tx: 116, ty: 190, guide: true },
      { type: "be", x: 158, y: 118, label: "BE", tx: 158, ty: 106 },
      { type: "profit", x: 202, y: 72, label: ["最大盈利", "Spread - 净支出"], tx: 282, ty: 90, anchor: "end", guide: true },
      { type: "action", x: 202, y: 72, label: "卖出较高 Call", tx: 282, ty: 58, anchor: "end", dot: false }
    ]
  },
  bullPutSpread: {
    title: "Bull Put Credit Spread 到期盈亏",
    path: "M48 162 L116 162 L202 72 L282 72",
    priceLabel: { y: 134 },
    markers: [
      { type: "loss", x: 74, y: 162, label: ["最大亏损", "Spread - 净权利金"], tx: 62, ty: 136, anchor: "start" },
      { type: "guard", x: 116, y: 162, label: "买入更低 Put", tx: 116, ty: 190, guide: true },
      { type: "be", x: 158, y: 118, label: "BE", tx: 158, ty: 106 },
      { type: "profit", x: 202, y: 72, label: ["最大盈利", "净权利金"], tx: 282, ty: 90, anchor: "end", guide: true },
      { type: "action", x: 202, y: 72, label: "卖出较高 Put", tx: 282, ty: 58, anchor: "end", dot: false }
    ]
  },
  cashSecuredPut: {
    title: "Cash-Secured Put 到期盈亏",
    path: "M48 174 L202 72 L282 72",
    priceLabel: { y: 134 },
    markers: [
      { type: "loss", x: 78, y: 154, label: "被指派后继续下跌仍亏", tx: 62, ty: 146, anchor: "start" },
      { type: "be", x: 132, y: 118, label: "BE", tx: 132, ty: 106 },
      { type: "profit", x: 202, y: 72, label: "保留权利金", tx: 282, ty: 96, anchor: "end", guide: true },
      { type: "action", x: 202, y: 72, label: "卖出 Put", tx: 282, ty: 58, anchor: "end", dot: false }
    ]
  },
  longPut: {
    title: "Long Put 到期盈亏",
    path: "M48 52 L202 162 L282 162",
    markers: [
      { type: "profit", x: 72, y: 70, label: "价格再往下才是利润", tx: 62, ty: 86, anchor: "start" },
      { type: "be", x: 132, y: 118, label: "BE", tx: 132, ty: 106 },
      { type: "strike", x: 202, y: 162, label: "Put 行权价", tx: 202, ty: 190, guide: true },
      { type: "loss", x: 248, y: 162, label: "最大亏损 = 支付的权利金", tx: 282, ty: 146, anchor: "end" }
    ]
  },
  bearPutSpread: {
    title: "Bear Put Debit Spread 到期盈亏",
    path: "M48 72 L116 72 L202 162 L282 162",
    markers: [
      { type: "profit", x: 74, y: 72, label: ["最大盈利", "Spread - 净支出"], tx: 62, ty: 90, anchor: "start" },
      { type: "guard", x: 116, y: 72, label: "卖出较低 Put", tx: 116, ty: 48, guide: true },
      { type: "be", x: 158, y: 118, label: "BE", tx: 158, ty: 106 },
      { type: "strike", x: 202, y: 162, label: ["最大亏损", "净支出"], tx: 282, ty: 136, anchor: "end", guide: true },
      { type: "action", x: 202, y: 162, label: "买入较高 Put", tx: 282, ty: 190, anchor: "end", dot: false }
    ]
  },
  bearCallSpread: {
    title: "Bear Call Credit Spread 到期盈亏",
    path: "M48 72 L116 72 L202 162 L282 162",
    markers: [
      { type: "profit", x: 74, y: 72, label: ["最大盈利", "净权利金"], tx: 62, ty: 90, anchor: "start" },
      { type: "profit", x: 116, y: 72, label: "卖出较低 Call", tx: 116, ty: 48, guide: true },
      { type: "be", x: 158, y: 118, label: "BE", tx: 158, ty: 106 },
      { type: "guard", x: 202, y: 162, label: ["最大亏损", "Spread - 净权利金"], tx: 282, ty: 136, anchor: "end", guide: true },
      { type: "action", x: 202, y: 162, label: "买入更高 Call", tx: 282, ty: 190, anchor: "end", dot: false }
    ]
  },
  protectivePut: {
    title: "Protective Put 到期盈亏",
    path: "M48 162 L116 162 L282 52",
    markers: [
      { type: "guard", x: 116, y: 162, label: ["买入 Put", "提供下方保护"], tx: 116, ty: 180, guide: true },
      { type: "be", x: 184, y: 118, label: "BE", tx: 184, ty: 106 },
      { type: "profit", x: 246, y: 76, label: "正股继续参与上涨", tx: 286, ty: 58, anchor: "end" }
    ]
  },
  collar: {
    title: "Collar 到期盈亏",
    path: "M48 162 L116 162 L202 72 L282 72",
    priceLabel: { y: 134 },
    markers: [
      { type: "guard", x: 116, y: 162, label: ["买入 OTM Put", "下方保护"], tx: 116, ty: 180, guide: true },
      { type: "be", x: 158, y: 118, label: "BE", tx: 158, ty: 106 },
      { type: "profit", x: 202, y: 72, label: "上方收益被封顶", tx: 282, ty: 96, anchor: "end", guide: true },
      { type: "action", x: 202, y: 72, label: "卖出 OTM Call", tx: 282, ty: 58, anchor: "end", dot: false }
    ]
  },
  coveredCall: {
    title: "Covered Call 到期盈亏",
    path: "M48 174 L202 72 L282 72",
    priceLabel: { y: 134 },
    markers: [
      { type: "loss", x: 78, y: 154, label: "最大风险仍来自正股下跌", tx: 62, ty: 146, anchor: "start" },
      { type: "be", x: 132, y: 118, label: "BE", tx: 132, ty: 106 },
      { type: "profit", x: 202, y: 72, label: "上方收益被封顶", tx: 282, ty: 96, anchor: "end", guide: true },
      { type: "action", x: 202, y: 72, label: "卖出 OTM Call", tx: 282, ty: 58, anchor: "end", dot: false }
    ]
  },
  ironCondor: {
    title: "Iron Condor 到期盈亏",
    path: "M48 162 L78 162 L126 72 L204 72 L252 162 L282 162",
    markers: [
      { type: "loss", x: 78, y: 162, label: "跌破左侧价差", tx: 62, ty: 146, anchor: "start", guide: true },
      { type: "profit", x: 164, y: 72, label: "区间内最大盈利", tx: 164, ty: 96 },
      { type: "be", x: 104, y: 118, label: "BE", tx: 104, ty: 106 },
      { type: "be", x: 226, y: 118, label: "BE", tx: 226, ty: 106 },
      { type: "loss", x: 252, y: 162, label: "涨破右侧价差", tx: 282, ty: 146, anchor: "end", guide: true }
    ]
  },
  calendar: {
    title: "Calendar Spread 近月到期形状",
    path: "M48 154 L104 118 L160 68 L216 118 L272 154",
    markers: [
      { type: "be", x: 104, y: 118, label: "BE", tx: 104, ty: 106 },
      { type: "profit", x: 160, y: 68, label: ["价格靠近执行价", "近月衰减最快"], tx: 160, ty: 42, guide: true },
      { type: "be", x: 216, y: 118, label: "BE", tx: 216, ty: 106 },
      { type: "loss", x: 258, y: 150, label: "价格离开中心太远", tx: 282, ty: 146, anchor: "end" }
    ]
  },
  longStraddle: {
    title: "Long Straddle 到期盈亏",
    path: "M48 54 L160 162 L272 54",
    markers: [
      { type: "be", x: 104, y: 118, label: "BE", tx: 104, ty: 106 },
      { type: "strike", x: 160, y: 162, label: ["ATM 中心", "最大亏损 = 双边权利金"], tx: 160, ty: 180, guide: true },
      { type: "be", x: 216, y: 118, label: "BE", tx: 216, ty: 106 },
      { type: "profit", x: 248, y: 78, label: "大波动覆盖权利金后盈利", tx: 286, ty: 58, anchor: "end" }
    ]
  }
};

const labels = {
  direction: {
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral"
  },
  iv: {
    low: "Low IV",
    normal: "Normal IV",
    high: "High IV"
  },
  objective: {
    directional: "Directional",
    income: "Income",
    own: "Own Stock",
    hedge: "Hedge"
  }
};

const state = {
  direction: "",
  iv: "",
  objective: "",
  paContext: ""
};

const termSections = [
  {
    title: "Basics",
    intro: "Call 和 Put 是所有期权结构的两块积木：一个管买入权，一个管卖出权。",
    terms: [
      {
        name: "Call",
        english: "Right to buy / 买入权",
        meaning: "Call 买方有权按行权价买入标的；买 Call 偏看涨，卖 Call 是把上方一部分收益卖给别人。",
        use: "做 Long Call、Bull Call Spread、Covered Call 前，先问自己是在买上涨权，还是在卖上方空间。"
      },
      {
        name: "Put",
        english: "Right to sell / 卖出权",
        meaning: "Put 买方有权按行权价卖出标的；买 Put 偏看跌或做保险，卖 Put 是愿意在某个价位接货。",
        use: "做 Long Put、Protective Put、CSP、Bull Put Spread 前，先确认你是在买下跌保护，还是在卖接货承诺。"
      }
    ]
  },
  {
    title: "Greeks",
    intro: "它们不是玄学，是仓位的体感：涨跌、加速、时间、波动率。",
    terms: [
      {
        name: "Delta",
        english: "Direction exposure / 方向暴露",
        meaning: "标的涨跌时，期权价格大概跟着动多少。Delta + 偏看涨，Delta - 偏看跌。",
        use: "先用它判断这笔交易到底在押上涨、下跌，还是中性。"
      },
      {
        name: "Gamma",
        english: "Delta sensitivity / 加速度",
        meaning: "价格越接近关键行权价，Delta 变化可能越快。",
        use: "Gamma + 喜欢大波动；Gamma - 怕突然急涨急跌。"
      },
      {
        name: "Theta",
        english: "Time decay / 时间损耗",
        meaning: "期权时间价值每天流失的方向。Theta - 是付时间成本，Theta + 是收时间价值。",
        use: "买方通常怕横盘拖时间；卖方通常希望时间安静流走。"
      },
      {
        name: "Vega",
        english: "Volatility sensitivity / 波动率敏感度",
        meaning: "IV 上升或下降时，期权价格受影响的程度。",
        use: "Vega + 喜欢 IV 上升；Vega - 喜欢 IV 回落。"
      }
    ]
  },
  {
    title: "Dealer Flow",
    intro: "这部分用来理解价格为什么有时被压住，有时又会被对冲需求推着加速。",
    terms: [
      {
        name: "Dealer Gamma",
        english: "Dealer hedging pressure / 做市商对冲压力",
        meaning: "Dealer 通常站在客户订单的另一边，需要不断对冲自己的 Delta；Dealer Gamma 说的是价格变动时，他们的对冲方向会怎么变。",
        use: "把它当背景变量看：它解释市场弹性，不适合单独当买卖信号。"
      },
      {
        name: "Positive Dealer Gamma",
        english: "Long gamma dealer book / 正 Gamma 库存",
        meaning: "当 Dealer 偏 Long Gamma，价格上涨时他们往往卖出对冲，价格下跌时往往买入对冲。",
        use: "这种环境容易压低 realized volatility，走势更容易来回磨、回归均值。"
      },
      {
        name: "Gamma Squeeze",
        english: "Forced hedging loop / 被动对冲放大",
        meaning: "如果 Dealer 偏 Short Gamma，价格快速冲向大量 Call 行权价时，他们可能被迫买入标的对冲。",
        use: "上涨带来更多买入对冲，买入又推高价格，形成短线加速；但一旦价格停住或到期结构变化，挤压也会退潮。"
      },
      {
        name: "Gamma Regime",
        tone: "alert",
        english: "Amplifier, not predictor / 放大或抑制机制",
        meaning: "Gamma regime 不是方向预测器。-Gamma 不代表一定涨，也可能加速跌；+Gamma 不代表一定横盘，只是更容易压制波动。",
        use: "新闻、流动性、0DTE flow、OI（Open Interest）分布变化，都可能迅速改变效果；要和 Context、IV、关键 strike 一起看。"
      }
    ]
  },
  {
    title: "Volatility",
    intro: "IV 不是方向预测，它更像市场给未来波动开的价格。",
    terms: [
      {
        name: "IV",
        english: "Implied Volatility / 隐含波动率",
        meaning: "市场从期权价格里反推出的未来波动预期。",
        use: "IV 高时，买期权更贵；卖权利金更有收入，但风险也更需要控制。"
      },
      {
        name: "IV Rank",
        english: "IVR / 隐含波动率排名",
        meaning: "把当前 IV 放到过去一段时间的区间里比较。",
        use: "IVR 高说明现在期权相对贵，IVR 低说明现在相对便宜。"
      },
      {
        name: "IV Crush",
        english: "Volatility crush / 波动率塌缩",
        meaning: "事件落地后，IV 快速下降，期权突然变便宜。",
        use: "财报后常见；方向看对但 IV 掉太多，买方也可能不赚钱。"
      }
    ]
  },
  {
    title: "Moneyness",
    intro: "ATM / ITM / OTM 其实是在说行权价和现价的相对位置。",
    terms: [
      {
        name: "Strike",
        english: "Strike Price / 行权价",
        meaning: "合约约定买入或卖出股票的价格。",
        use: "选 Strike，本质是在选你的目标价、保护线或风险边界。"
      },
      {
        name: "ATM",
        english: "At the Money / 平值",
        meaning: "行权价接近当前股价。",
        use: "反应灵敏，常用作方向价差、跨式或日历价差的中心。"
      },
      {
        name: "ITM",
        english: "In the Money / 实值",
        meaning: "已经有内在价值的期权。",
        use: "更像股票，Delta 更高，但成本也通常更高。"
      },
      {
        name: "OTM",
        english: "Out of the Money / 虚值",
        meaning: "暂时没有内在价值的期权。",
        use: "更便宜，但需要价格真的走到那里，才会变得有力。"
      }
    ]
  },
  {
    title: "Structure",
    intro: "看懂 Debit / Credit / Spread，就能更快理解策略赚亏来源。",
    terms: [
      {
        name: "Premium",
        english: "Option premium / 权利金",
        meaning: "买期权付出去的钱，或卖期权先收到的钱。",
        use: "它决定最大成本、收入缓冲，也决定盈亏平衡点。"
      },
      {
        name: "Debit",
        english: "Net debit / 净支出",
        meaning: "开仓时整体要付钱。",
        use: "常见于 Long Call、Long Put、Debit Spread，最大亏损多是净支出。"
      },
      {
        name: "Credit",
        english: "Net credit / 净收入",
        meaning: "开仓时整体先收钱。",
        use: "常见于 CSP、Covered Call、Credit Spread，核心是守住风险边界。"
      },
      {
        name: "Spread",
        english: "Spread / 价差",
        meaning: "同时买一条腿、卖一条腿，把收益和风险都框起来。",
        use: "Spread 宽度就是两个行权价的距离，是很多价差策略的盈亏上限基础。"
      }
    ]
  },
  {
    title: "Trade Management",
    intro: "管理不是拖延，而是重新评估。",
    terms: [
      {
        name: "DTE",
        english: "Days to Expiration / 到期天数",
        meaning: "距离到期还有多少天；越靠近到期，Theta、Gamma 和跳空风险的体感越强。",
        use: "DTE 越短，越不能只盯着剩余 Premium，要重新比较剩余收益和继续持仓的风险。"
      },
      {
        name: "Breakeven",
        english: "Break-even point / 盈亏平衡点",
        meaning: "到期时不赚不亏的大致价格线。",
        use: "方向看对还不够，价格要越过 Breakeven 才是真正赚钱。"
      },
      {
        name: "Assignment",
        english: "Assignment / 被指派",
        meaning: "你卖出的期权被买方行权，可能被要求买入或卖出正股。",
        use: "卖 Put 前先问自己愿不愿意接货；卖 Call 前先问自己愿不愿意卖股。"
      },
      {
        name: "Credit Spread",
        english: "Remaining premium vs risk / 剩余收益与风险再比较",
        meaning: "信用价差如果已经赚到大部分 Premium，就要重新比较：剩余收益，值不值得继续承担 Gamma / Gap Risk？",
        use: "如果剩余利润很小，但到期、事件或突破风险变大，平仓不是胆小，是重新定价风险。"
      },
      {
        name: "Roll",
        english: "Close and reopen / 平旧仓并建新仓",
        meaning: "Roll = 平掉旧仓 + 建立新仓。核心不是“救仓”，而是重新问：如果现在没有这笔仓位，我还会不会开新的这一笔？",
        use: "只有新仓仍符合当前 Context、IV、目标和风险边界，Roll 才是管理；否则只是拖延。"
      }
    ]
  }
];

const libraryOrder = [
  "longCall",
  "bullCallSpread",
  "bullPutSpread",
  "cashSecuredPut",
  "longPut",
  "bearPutSpread",
  "bearCallSpread",
  "protectivePut",
  "collar",
  "coveredCall",
  "ironCondor",
  "calendar",
  "longStraddle"
];

const cases = [
  {
    title: "早盘一路抬高，不给深回调",
    prompt: "你看见买盘一直愿意在更高的位置接，回踩很浅，IV 还没明显升温。",
    answer: "longCall",
    options: ["longCall", "bullPutSpread", "ironCondor"],
    reason: "这题核心是速度。IV 还不贵时，Long Call 比卖 Put 更能吃到向上的加速。"
  },
  {
    title: "已经涨了一段，但目标还没到",
    prompt: "你仍然看涨，但 Call 已经不便宜；你的目标是到前高附近，不是押无限拉升。",
    answer: "bullCallSpread",
    options: ["longCall", "bullCallSpread", "cashSecuredPut"],
    reason: "目标价明确时，用上方 Call 换回一部分成本，会比裸买 Call 更贴近这个判断。"
  },
  {
    title: "趋势偏多，但每次推进都变慢",
    prompt: "价格还在支撑上方，可是追涨的感觉不好；你更愿意押支撑别破。",
    answer: "bullPutSpread",
    options: ["bullPutSpread", "longCall", "longStraddle"],
    reason: "这里不是赌大涨，而是赌下方守住。Bull Put Credit Spread 赚的是时间和支撑。"
  },
  {
    title: "想买，但不想按现价追",
    prompt: "你愿意持有这家公司，只是觉得现在的位置不够舒服。",
    answer: "cashSecuredPut",
    options: ["cashSecuredPut", "longCall", "ironCondor"],
    reason: "CSP 的重点是接货计划：没跌到就收权利金，跌到就按你愿意的位置买。"
  },
  {
    title: "手里有股，上方有满意卖点",
    prompt: "你不急着卖，但如果价格冲到目标区，被拿走仓位也可以接受。",
    answer: "coveredCall",
    options: ["coveredCall", "protectivePut", "longStraddle"],
    reason: "Covered Call 适合把上方一段空间换成现金流，前提是你真的接受被行权卖出。"
  },
  {
    title: "浮盈不错，怕一个消息砸下来",
    prompt: "你想继续拿着正股，但短期有事件风险，不想用卖 Call 封住上方。",
    answer: "protectivePut",
    options: ["coveredCall", "protectivePut", "bullPutSpread"],
    reason: "Protective Put 是最直接的保险。贵不贵是另一个问题，但保护逻辑最干净。"
  },
  {
    title: "想保护利润，但保险费刺眼",
    prompt: "正股还想留，Put 太贵；你愿意牺牲一部分上方空间来换便宜保险。",
    answer: "collar",
    options: ["protectivePut", "collar", "coveredCall"],
    reason: "Collar 是把保护和让利打包：下方有保险，上方也被封顶。"
  },
  {
    title: "反弹越来越弱，卖盘主动",
    prompt: "价格不断被压回去，反抽没力，IV 仍然正常偏低。",
    answer: "longPut",
    options: ["longPut", "ironCondor", "cashSecuredPut"],
    reason: "当下跌速度本身就是观点时，低 IV 的 Long Put 最直接。"
  },
  {
    title: "看回前低，但不想买太贵 Put",
    prompt: "你判断还有一段下行，但目标大概就是前低附近，IV 已经不便宜。",
    answer: "bearPutSpread",
    options: ["longPut", "bearPutSpread", "bearCallSpread"],
    reason: "有限目标配有限收益结构。Bear Put Spread 用卖低行权价 Put 把入场成本压低。"
  },
  {
    title: "上方压力清楚，但没到崩盘程度",
    prompt: "你偏空，可价格更像慢慢被压住，而不是马上瀑布。",
    answer: "bearCallSpread",
    options: ["bearCallSpread", "longCall", "cashSecuredPut"],
    reason: "这种题重点是“别站回压力上方”。Bear Call Credit Spread 比追空更稳一点。"
  },
  {
    title: "区间很清楚，IV 给得很肥",
    prompt: "价格在上下沿之间来回磨，市场却给了很高的波动率定价。",
    answer: "ironCondor",
    options: ["ironCondor", "longStraddle", "protectivePut"],
    reason: "如果你判断边界暂时都守得住，高 IV 下卖两边比买波动更合理。"
  },
  {
    title: "盘了很久，期权却很便宜",
    prompt: "价格越收越窄，你不知道往哪边走，但感觉快要选择方向了。",
    answer: "longStraddle",
    options: ["longStraddle", "ironCondor", "calendar"],
    reason: "你买的不是方向，而是后面可能放大的波动。Low IV 让这个押注没那么贵。"
  },
  {
    title: "这周可能磨，下个月可能有戏",
    prompt: "短线看不出方向，近月时间价值掉得快，但远月还可能等到新催化。",
    answer: "calendar",
    options: ["calendar", "longCall", "bearCallSpread"],
    reason: "Calendar 更像交易不同到期日之间的时间和 IV 差，不是简单看涨或看跌。"
  },
  {
    title: "跌破下沿后马上收回",
    prompt: "你看到一次下破失败，价格重新站回区间，Call 的价格还没被抢贵。",
    answer: "bullCallSpread",
    options: ["bullCallSpread", "bullPutSpread", "longStraddle"],
    reason: "低 IV 时可以用 debit 思路押回区间；上方卖 Call 是为了让这笔试错更轻。"
  },
  {
    title: "下沿收回，但你本来就想买股",
    prompt: "这次假跌破让你更想在下方挂接货计划，IV 也给了不错权利金。",
    answer: "cashSecuredPut",
    options: ["cashSecuredPut", "bullCallSpread", "longStraddle"],
    reason: "如果接货本来就在计划内，CSP 比硬追更符合你的目标。"
  },
  {
    title: "下沿收回，但不想真的接货",
    prompt: "你觉得下方大概率守住，也想收高 IV 的权利金，但账户不想扛正股。",
    answer: "bullPutSpread",
    options: ["cashSecuredPut", "bullPutSpread", "longCall"],
    reason: "Bull Put Spread 把卖 Put 的想法变成 Defined Risk，适合“不跌破就好”的判断。"
  },
  {
    title: "冲上沿失败，Put 还便宜",
    prompt: "价格假突破后跌回区间，你想押回落到中部，但不想裸买太多 premium。",
    answer: "bearPutSpread",
    options: ["bearPutSpread", "bearCallSpread", "ironCondor"],
    reason: "低 IV 下的 Bear Put Spread 可以押下行，同时用更低行权价 Put 抵掉部分成本。"
  },
  {
    title: "冲上沿失败，Call 权利金很厚",
    prompt: "上方压力刚被验证，IV 偏贵；你不需要它大跌，只需要别重新突破。",
    answer: "bearCallSpread",
    options: ["bearPutSpread", "bearCallSpread", "longStraddle"],
    reason: "这更像卖上方压力。Bear Call Spread 赚的是价格留在卖出 Call 下方。"
  },
  {
    title: "关键位附近像被钉住",
    prompt: "几次突破和跌破都很快被拉回，盘口像是在压波动，IV 也不低。",
    answer: "ironCondor",
    options: ["ironCondor", "longStraddle", "longCall"],
    reason: "Positive Dealer Gamma 常见的是波动被压住；如果你也认同区间，卖区间更顺。"
  },
  {
    title: "突破后突然越涨越急",
    prompt: "价格穿过关键位后开始加速，回调给得很少，追涨资金明显变多。",
    answer: "longCall",
    options: ["longCall", "coveredCall", "ironCondor"],
    reason: "这种题怕的是低估 Gamma。Long Call 能更直接参与向上加速。"
  },
  {
    title: "支撑破了之后越跌越快",
    prompt: "原本横盘很久，一跌破关键位就连续触发止损，反抽也很弱。",
    answer: "longPut",
    options: ["longPut", "cashSecuredPut", "ironCondor"],
    reason: "当市场进入加速段时，不要把它当普通区间处理；Long Put 更贴近速度风险。"
  },
  {
    title: "高 IV，但只是轻微偏空",
    prompt: "你不想赌大跌，只觉得价格短期很难重新站上压力。",
    answer: "bearCallSpread",
    options: ["longPut", "bearCallSpread", "longStraddle"],
    reason: "轻微偏空时，卖上方 Call 价差比买 Put 更符合“别涨上去”的观点。"
  },
  {
    title: "涨太快后想继续拿股",
    prompt: "你有正股，短线涨幅已经很大；你想收点权利金，但还能接受上方卖飞。",
    answer: "coveredCall",
    options: ["coveredCall", "longCall", "bearPutSpread"],
    reason: "这不是新开多头，而是管理已有仓位。Covered Call 用上方空间换现金流。"
  },
  {
    title: "想赌事件后大动，但 IV 没涨起来",
    prompt: "公司快有关键消息，市场定价却还很平，你也判断方向很难提前猜。",
    answer: "longStraddle",
    options: ["longStraddle", "ironCondor", "coveredCall"],
    reason: "当事件可能带来大幅波动，而 IV 还没反映出来，Long Vol 才有学习价值。"
  },
  {
    title: "近月 IV 很高，远月没那么夸张",
    prompt: "短期消息快落地，你觉得近月会被 IV crush，但远月还保留后续想象。",
    answer: "calendar",
    options: ["calendar", "longPut", "bullPutSpread"],
    reason: "Calendar 的核心是近月和远月的差异，不是单纯押涨跌。"
  },
  {
    title: "支撑附近 IV 很高，但你仓位太小",
    prompt: "你想收 Put 权利金，可一旦被指派，买入正股会占用太多资金。",
    answer: "bullPutSpread",
    options: ["cashSecuredPut", "bullPutSpread", "coveredCall"],
    reason: "资金和风险承受力不够时，把 CSP 改成 Defined Risk 的 put spread 更合理。"
  },
  {
    title: "上沿失败，但目标只看到区间中部",
    prompt: "你偏空，不过只是看回中轴；Put 不算贵，但你不想为崩盘付费。",
    answer: "bearPutSpread",
    options: ["longPut", "bearPutSpread", "bearCallSpread"],
    reason: "有限下跌目标更适合价差。它牺牲远端暴利，换来更低成本。"
  },
  {
    title: "方向没把握，但你想先学观察",
    prompt: "价格在区间中部，IV 正常，没有明显边界优势，也没有强催化。",
    answer: "calendar",
    options: ["calendar", "longCall", "cashSecuredPut"],
    reason: "这种题不适合硬押方向。Calendar 至少提醒你观察时间结构，而不是只盯涨跌。"
  }
];

const CASE_PRACTICE_SIZE = 8;
let activeCases = [];

const paContexts = [
  {
    id: "trend-strong-up",
    group: "Strong Trend",
    subtype: "Up",
    tone: "bull",
    english: "Strong Bull Trend",
    title: "强上涨趋势",
    read: "连续 HH/HL，回调浅，突破后接受良好，重点是跟随主方向。",
    direction: "bullish",
    iv: "low",
    objective: "directional",
    main: "longCall",
    alternatives: ["bullCallSpread", "bullPutSpread"],
    note: "强趋势赚方向和速度；IV 偏高时，用价差控制权利金。"
  },
  {
    id: "trend-strong-down",
    group: "Strong Trend",
    subtype: "Down",
    tone: "bear",
    english: "Strong Bear Trend",
    title: "强下跌趋势",
    read: "连续 LH/LL，反抽弱，跌破后接受良好，重点是顺势看下方。",
    direction: "bearish",
    iv: "low",
    objective: "directional",
    main: "longPut",
    alternatives: ["bearPutSpread", "bearCallSpread"],
    note: "IV 不贵时，买方结构能更直接表达下跌速度。"
  },
  {
    id: "trend-weak-up",
    group: "Weak Trend",
    subtype: "Up",
    tone: "bull",
    english: "Weak Bull Trend",
    title: "弱上涨趋势",
    read: "仍偏多，但推进变慢，更像在支撑上方磨，不适合追高。",
    direction: "bullish",
    iv: "high",
    objective: "income",
    main: "bullPutSpread",
    alternatives: ["cashSecuredPut", "bullCallSpread"],
    note: "弱趋势不一定要追方向，可以卖一个“别跌破”的观点。"
  },
  {
    id: "trend-weak-down",
    group: "Weak Trend",
    subtype: "Down",
    tone: "bear",
    english: "Weak Bear Trend",
    title: "弱下跌趋势",
    read: "仍偏空，但下跌变慢，更像在压力下方磨，不适合追空。",
    direction: "bearish",
    iv: "high",
    objective: "income",
    main: "bearCallSpread",
    alternatives: ["bearPutSpread", "ironCondor"],
    note: "弱趋势向下，更适合卖一个“别突破压力”的观点。"
  },
  {
    id: "tr-low",
    group: "TR",
    subtype: "Low IV",
    tone: "range",
    english: "Trading Range / Low IV",
    title: "TR + 低 IV，等离开区间",
    read: "价格在区间里越压越紧，方向不确定，但你觉得波动快要放大。",
    direction: "neutral",
    iv: "low",
    objective: "directional",
    main: "longStraddle",
    alternatives: ["calendar", "bullCallSpread"],
    note: "TR 里低 IV 时，重点不是押方向，而是押波动被低估。"
  },
  {
    id: "tr-fbo-lower",
    group: "TR",
    subtype: "Lower-edge FBO",
    tone: "range",
    english: "TR Lower-edge FBO",
    title: "TR 下沿 FBO",
    readLines: [
      "价格假跌破下沿后重新收回，核心是押价格至少回到区间内。",
      "Low IV 用 Bull Call Debit Spread；High IV 用 Bull Put Credit Spread。"
    ],
    badges: ["Bullish", "Low(High) IV", "Bull Call Debit(Put Credit) Spread"],
    direction: "bullish",
    iv: "normal",
    objective: "directional",
    main: "bullCallSpread",
    alternatives: ["longCall", "bullPutSpread"],
    note: "TR 下沿 FBO 的大前提是价格重新收回区间；Low IV 用 debit 付更便宜权利金，High IV 用 credit 收更厚权利金。"
  },
  {
    id: "tr-fbo-upper",
    group: "TR",
    subtype: "Upper-edge FBO",
    tone: "range",
    english: "TR Upper-edge FBO",
    title: "TR 上沿 FBO",
    readLines: [
      "价格假突破上沿后重新回落，核心是押价格至少回到区间内。",
      "Low IV 用 Bear Put Debit Spread；High IV 用 Bear Call Credit Spread。"
    ],
    badges: ["Bearish", "Low(High) IV", "Bear Put Debit(Bear Call Credit) Spread"],
    direction: "bearish",
    iv: "normal",
    objective: "directional",
    main: "bearPutSpread",
    alternatives: ["longPut", "bearCallSpread"],
    note: "TR 上沿 FBO 的大前提是价格重新回到区间；Low IV 用 debit 付更便宜权利金，High IV 用 credit 收更厚权利金。"
  },
  {
    id: "tr-high",
    group: "TR",
    subtype: "High IV",
    tone: "range",
    english: "Trading Range / High IV",
    title: "TR + 高 IV，继续横盘",
    read: "价格仍在区间中部，市场给的 IV 偏贵，你判断短期还出不去。",
    direction: "neutral",
    iv: "high",
    objective: "income",
    main: "ironCondor",
    alternatives: ["calendar", "coveredCall"],
    note: "TR 里高 IV 时，更像卖区间；核心风险是边界被突破。"
  },
  {
    id: "tr-calendar",
    group: "TR",
    subtype: "Time Spread",
    tone: "range",
    english: "Trading Range / Calendar",
    title: "TR + 近月磨，远月可能动",
    read: "短期大概率还在中心附近消耗，但后面可能有新的方向或事件。",
    direction: "neutral",
    iv: "normal",
    objective: "directional",
    main: "calendar",
    alternatives: ["longStraddle", "ironCondor"],
    note: "Calendar 交易的是现在的时间 vs 未来的时间，不只是方向。"
  }
];

const paContextGroups = [
  {
    title: "Strong Trend",
    subtitle: "Clean directional pressure",
    contextIds: ["trend-strong-up", "trend-strong-down"]
  },
  {
    title: "Weak Trend",
    subtitle: "Fading directional pressure",
    contextIds: ["trend-weak-up", "trend-weak-down"]
  },
  {
    title: "TR",
    subtitle: "Trading Range",
    contextIds: [
      "tr-high",
      "tr-calendar",
      "tr-low",
      "tr-fbo-lower",
      "tr-fbo-upper"
    ]
  }
];

function recommend({ direction, iv, objective }) {
  if (objective === "hedge") {
    if (iv === "high") return pick("collar", ["protectivePut", "coveredCall"]);
    return pick("protectivePut", ["collar", direction === "bearish" ? "bearPutSpread" : "coveredCall"]);
  }

  if (objective === "own") {
    if (direction === "bearish") return pick("bearPutSpread", ["longPut", "protectivePut"]);
    if (iv === "low") return pick("cashSecuredPut", ["bullCallSpread", "longCall"]);
    return pick("cashSecuredPut", ["bullPutSpread", "coveredCall"]);
  }

  if (direction === "bullish") {
    if (objective === "income") {
      return iv === "low"
        ? pick("coveredCall", ["bullCallSpread", "cashSecuredPut"])
        : pick("bullPutSpread", ["cashSecuredPut", "coveredCall"]);
    }
    if (iv === "low") return pick("longCall", ["bullCallSpread", "cashSecuredPut"]);
    if (iv === "normal") return pick("bullCallSpread", ["longCall", "bullPutSpread"]);
    return pick("bullCallSpread", ["bullPutSpread", "cashSecuredPut"]);
  }

  if (direction === "bearish") {
    if (objective === "income") {
      return iv === "high"
        ? pick("bearCallSpread", ["bearPutSpread", "ironCondor"])
        : pick("bearCallSpread", ["bearPutSpread", "longPut"]);
    }
    if (iv === "low") return pick("longPut", ["bearPutSpread", "bearCallSpread"]);
    if (iv === "normal") return pick("bearPutSpread", ["longPut", "bearCallSpread"]);
    return pick("bearPutSpread", ["bearCallSpread", "longPut"]);
  }

  if (direction === "neutral") {
    if (objective === "directional") {
      return iv === "low"
        ? pick("calendar", ["longStraddle", "ironCondor"])
        : pick("calendar", ["ironCondor", "coveredCall"]);
    }
    if (iv === "low") return pick("longStraddle", ["calendar", "ironCondor"]);
    if (iv === "normal") return pick("calendar", ["ironCondor", "coveredCall"]);
    return pick("ironCondor", ["calendar", "coveredCall"]);
  }

  return pick("bullCallSpread", ["bullPutSpread", "cashSecuredPut"]);
}

function pick(main, alternatives) {
  return { main, alternatives: alternatives.slice(0, 2) };
}

function strategyLabel(key) {
  const strategy = strategies[key];
  return strategy.english;
}

function findPaContext(id) {
  return paContexts.find((item) => item.id === id);
}

function paMatchesForStrategy(key) {
  return paContexts.filter((context) => context.main === key || context.alternatives.includes(key));
}

function compactLibraryContexts(contexts) {
  const byId = new Map(contexts.map((context) => [context.id, context]));
  const usedIds = new Set();
  const tags = [];
  const combos = [
    {
      ids: ["trend-strong-up", "trend-weak-up"],
      label: "Strong/Weak Bull Trend",
      tone: "bull"
    },
    {
      ids: ["trend-strong-down", "trend-weak-down"],
      label: "Strong/Weak Bear Trend",
      tone: "bear"
    }
  ];

  combos.forEach((combo) => {
    if (combo.ids.every((id) => byId.has(id))) {
      combo.ids.forEach((id) => usedIds.add(id));
      tags.push({ label: combo.label, tone: combo.tone });
    }
  });

  contexts.forEach((context) => {
    if (usedIds.has(context.id)) return;
    tags.push({
      label: context.english.replace("Trading Range", "TR"),
      tone: context.tone
    });
  });

  return tags.slice(0, 3);
}

const libraryContextOverrides = {
  bullCallSpread: [
    { label: "Strong/Weak Bull Trend", tone: "bull" },
    { label: "TR Low IV / Lower-edge FBO", tone: "range" }
  ],
  bearPutSpread: [
    { label: "Strong/Weak Bear Trend", tone: "bear" },
    { label: "TR Low IV / Upper-edge FBO", tone: "range" }
  ],
  bullPutSpread: [
    { label: "Strong/Weak Bull Trend", tone: "bull" },
    { label: "TR High IV / Lower-edge FBO", tone: "range" }
  ],
  bearCallSpread: [
    { label: "Strong/Weak Bear Trend", tone: "bear" },
    { label: "TR High IV / Upper-edge FBO", tone: "range" }
  ]
};

function libraryContextTags(key) {
  const tags = libraryContextOverrides[key] || compactLibraryContexts(paMatchesForStrategy(key));
  if (!tags.length) {
    return `<span class="library-context-chip tone-neutral">Depends on Cycle</span>`;
  }
  return tags
    .map((tag) => `<span class="library-context-chip tone-${tag.tone}">${tag.label}</span>`)
    .join("");
}

function recommendFromPaContext(context, objective) {
  if (!context || !objective) return null;

  if (context.id === "tr-low" && objective === "directional") {
    return pick("longStraddle", ["calendar", "bullCallSpread"]);
  }
  if (context.id === "tr-fbo-lower") {
    if (objective === "directional") return pick("bullCallSpread", ["longCall", "bullPutSpread"]);
    if (objective === "income") return pick("bullPutSpread", ["cashSecuredPut", "bullCallSpread"]);
  }
  if (context.id === "tr-high" && objective === "income") {
    return pick("ironCondor", ["calendar", "coveredCall"]);
  }
  if (context.id === "tr-fbo-upper") {
    if (objective === "directional") return pick("bearPutSpread", ["longPut", "bearCallSpread"]);
    if (objective === "income") return pick("bearCallSpread", ["bearPutSpread", "ironCondor"]);
  }
  if (context.id === "tr-calendar" && objective === "directional") {
    return pick("calendar", ["longStraddle", "ironCondor"]);
  }

  return recommend({
    direction: context.direction,
    iv: context.iv,
    objective
  });
}

function strategyCard(key, options = {}) {
  const strategy = strategies[key];
  const tagClass = options.compact ? "tag-row compact-tags" : "tag-row";
  const contextBlock = options.context
    ? `
      <div class="field-block context-result">
        <h3>Context</h3>
        <p class="pa-result-title tone-${options.context.tone}">${options.context.english}</p>
        <span>${options.context.note}</span>
      </div>
    `
    : "";
  return `
    <div class="strategy-name">
      <strong>${strategy.english}</strong>
    </div>
    ${contextBlock}
    <div class="field-block structure-block">
      <h3>Legs</h3>
      <p>${strategy.structure}</p>
    </div>
    <div class="money-grid">
      <div class="money-block earn-block">
        <h3>Earn</h3>
        <p>${strategy.profit}</p>
      </div>
      <div class="money-block lose-block">
        <h3>Lose</h3>
        <p>${strategy.loss}</p>
      </div>
    </div>
    <div class="field-block expiration-block">
      <h3>Expiration P/L</h3>
      <ul class="expiration-list">
        ${strategy.expiration.map((line) => `<li>${line}</li>`).join("")}
      </ul>
    </div>
    <div class="field-block">
      <h3>Why</h3>
      <p>${strategy.why}</p>
    </div>
    <div class="field-block">
      <h3>When not to use</h3>
      <p>${strategy.avoid}</p>
    </div>
    <div class="${tagClass}">
      ${greekTags(strategy.greeks)}
      <span class="tag risk">${strategy.risk}</span>
    </div>
    <div class="strategy-details">
      <details>
        <summary>展开细节</summary>
        <div class="detail-grid">
          ${payoffSvg(key, strategy)}
          <ul class="notes">
            ${strategy.notes.map((note) => `<li>${note}</li>`).join("")}
          </ul>
        </div>
      </details>
    </div>
  `;
}

function greekTags(greeks) {
  return Object.entries(greeks)
    .map(([name, value]) => `<span class="tag ${name.toLowerCase()}">${name} ${value}</span>`)
    .join("");
}

function payoffLabelTone(line, fallbackTone, previousTone = "") {
  if (line === "BE") return "be";
  if (/权利金|净支出|Spread|价差/.test(line) && ["loss", "profit"].includes(previousTone)) {
    return previousTone;
  }
  if (/最大亏损|亏损|跌破|涨破|离开/.test(line)) return "loss";
  if (/最大盈利|利润|保留权利金|继续参与上涨|收益被封顶|近月衰减|覆盖权利金/.test(line)) return "profit";
  if (/买入|卖出|行权价|ATM/.test(line)) return "action";
  return fallbackTone;
}

function payoffSvg(key, strategy) {
  const diagram = payoffDiagrams[key];
  const zeroY = 118;
  const priceLabel = { x: 286, y: 110, anchor: "end", ...(diagram.priceLabel || {}) };
  const labels = diagram.markers
    .map((marker) => {
      const lines = Array.isArray(marker.label) ? marker.label : [marker.label];
      let previousTone = "";
      return `
        <text class="payoff-label payoff-label-${marker.type}" x="${marker.tx}" y="${marker.ty}" text-anchor="${marker.anchor || "middle"}">
          ${lines
            .map((line, index) => {
              const tone = payoffLabelTone(line, marker.type, previousTone);
              previousTone = tone;
              return `<tspan class="payoff-label-line payoff-label-${tone}" x="${marker.tx}" dy="${index ? 12 : 0}">${line}</tspan>`;
            })
            .join("")}
        </text>
      `;
    })
    .join("");
  const guides = diagram.markers
    .filter((marker) => marker.guide)
    .map((marker) => {
      const guideTone = marker.y < zeroY ? "profit" : marker.y > zeroY ? "loss" : "neutral";
      return `
        <line class="marker-guide marker-guide-${guideTone}" x1="${marker.x}" y1="${Math.min(marker.y, zeroY)}" x2="${marker.x}" y2="${Math.max(marker.y, zeroY)}" />
      `;
    })
    .join("");
  const markers = diagram.markers
    .map((marker) => (marker.dot === false ? "" : `<circle class="payoff-marker marker-${marker.type}" cx="${marker.x}" cy="${marker.y}" r="5" />`))
    .join("");

  return `
    <svg class="payoff" viewBox="0 0 320 210" aria-label="${strategy.name} 到期损益示意">
      <text class="chart-title" x="160" y="22" text-anchor="middle">${diagram.title}</text>
      <line class="axis" x1="44" y1="${zeroY}" x2="288" y2="${zeroY}" />
      <line class="axis" x1="48" y1="34" x2="48" y2="176" />
      <text class="axis-label" x="39" y="43" text-anchor="end">+ 盈利</text>
      <text class="axis-label" x="39" y="178" text-anchor="end">- 亏损</text>
      <text class="axis-label price-label" x="${priceLabel.x}" y="${priceLabel.y}" text-anchor="${priceLabel.anchor}">标的价格</text>
      ${guides}
      <path class="curve" d="${diagram.path}" />
      ${markers}
      ${labels}
    </svg>
  `;
}

function renderTerms() {
  document.querySelector("#terms-grid").innerHTML = termSections
    .map(
      (section) => `
        <section class="term-section" aria-label="${section.title}">
          <div class="term-section-heading">
            <h2>${section.title}</h2>
            <p>${section.intro}</p>
          </div>
          <div class="term-card-grid">
            ${section.terms
              .map(
                (term) => `
                  <article class="term-card${term.tone ? ` term-card-${term.tone}` : ""}">
                    <h3>${term.name} <span>${term.english}</span></h3>
                    <p>${term.meaning}</p>
                    <p class="term-use"><strong>How</strong><span>${term.use}</span></p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function renderPaContexts() {
  document.querySelector("#pa-context-grid").innerHTML = paContextGroups
    .map((group) => {
      const contexts = group.contextIds.map(findPaContext).filter(Boolean);
      return `
        <section class="pa-context-group" aria-label="${group.title}">
          <div class="pa-context-group-heading">
            <h3>${group.title}</h3>
            <span>${group.subtitle}</span>
          </div>
          <div class="pa-context-group-list">
            ${contexts
              .map((context) => {
                const reads = context.readLines || [context.read];
                const badges = context.badges || [
                  labels.direction[context.direction],
                  labels.iv[context.iv],
                  strategyLabel(context.main)
                ];
                return `
                  <button class="pa-context-card tone-${context.tone}" type="button" data-pa-context="${context.id}">
                    <span class="context-title">${context.english}</span>
                    ${reads.map((line) => `<span class="context-read">${line}</span>`).join("")}
                    <span class="context-badges">
                      ${badges.map((badge) => `<span>${badge}</span>`).join("")}
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderRecommendation() {
  const paContext = findPaContext(state.paContext);
  if (!paContext || !state.objective) return;

  const result = recommendFromPaContext(paContext, state.objective);
  const context = `Context: ${paContext.english} / Objective: ${labels.objective[state.objective]}`;

  document.querySelector("#result-context").textContent = context;
  document.querySelector("#main-result").innerHTML = strategyCard(result.main, { context: paContext });
  document.querySelector("#alternatives").innerHTML = `
    <p class="kicker">Alternatives</p>
    ${result.alternatives
      .map(
        (key) => `
          <article class="alt-item">
            ${strategyCard(key, { compact: true })}
          </article>
        `
      )
      .join("")}
  `;

  document.querySelector("#result-empty").classList.add("is-hidden");
  document.querySelector("#result").classList.remove("is-hidden");
}

function unlockStep(field) {
  const step = document.querySelector(`[data-step="${field}"]`);
  if (!step) return;
  step.classList.remove("is-muted");
  step.querySelectorAll("button").forEach((button) => {
    button.disabled = false;
  });
}

function lockStep(field) {
  const step = document.querySelector(`[data-step="${field}"]`);
  if (!step) return;
  step.classList.add("is-muted");
  step.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    button.classList.remove("is-selected");
  });
}

function syncWizardSelections() {
  document.querySelectorAll(".choice").forEach((button) => {
    button.classList.toggle("is-selected", state[button.dataset.field] === button.dataset.value);
  });
}

function setEmptyResult(title, body) {
  const empty = document.querySelector("#result-empty");
  empty.querySelector("h2").textContent = title;
  empty.querySelector("p:last-child").textContent = body;
  hideResult();
}

function syncPaContextSelections() {
  document.querySelectorAll(".pa-context-card").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.paContext === state.paContext);
  });
}

function scrollObjectiveIntoView() {
  const objectiveStep = document.querySelector('[data-step="objective"]');
  if (!objectiveStep) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    objectiveStep.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}

function scrollContextIntoView() {
  const contextPanel = document.querySelector(".context-panel");
  if (!contextPanel) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    contextPanel.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}

function scrollRecommendationIntoView() {
  const resultShell = document.querySelector(".result-shell");
  if (!resultShell) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    resultShell.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}

function scrollCasesIntoView() {
  const casesView = document.querySelector("#cases");
  if (!casesView) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    casesView.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}

function applyPaContext(id) {
  const context = findPaContext(id);
  if (!context) return;

  state.direction = context.direction;
  state.iv = context.iv;
  state.paContext = context.id;

  unlockStep("objective");
  syncWizardSelections();
  syncPaContextSelections();
  if (state.objective) {
    renderRecommendation();
  } else {
    setEmptyResult("Context Selected", "再选一个 objective，就会显示对应策略。");
  }
  scrollObjectiveIntoView();
}

function selectChoice(button) {
  const field = button.dataset.field;
  const value = button.dataset.value;
  state[field] = value;

  document
    .querySelectorAll(`[data-field="${field}"]`)
    .forEach((item) => item.classList.toggle("is-selected", item === button));

  if (field === "objective") {
    renderRecommendation();
    scrollRecommendationIntoView();
  }
}

function hideResult() {
  document.querySelector("#result").classList.add("is-hidden");
  document.querySelector("#result-empty").classList.remove("is-hidden");
}

function resetGuide() {
  state.direction = "";
  state.iv = "";
  state.objective = "";
  state.paContext = "";
  document.querySelectorAll(".choice").forEach((button) => {
    button.classList.remove("is-selected");
  });
  syncPaContextSelections();
  lockStep("objective");
  setEmptyResult("Pick Context, Then Objective", "结果会只保留主推荐、关键理由和风险标签。");
  scrollContextIntoView();
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewId);
  });
  if (window.location.hash !== `#${viewId}`) window.location.hash = viewId;
}

function renderLibrary() {
  document.querySelector("#library-grid").innerHTML = libraryOrder
    .map((key) => {
      const item = strategies[key];
      return `
        <article class="library-card">
          <h2>${item.english}</h2>
          <p class="structure-line">${item.structure}</p>
          <div class="library-context-list" aria-label="Market cycle">
            ${libraryContextTags(key)}
          </div>
          <div class="library-money">
            <p><strong>赚：</strong>${item.profit}</p>
            <p><strong>亏：</strong>${item.loss}</p>
          </div>
          <details class="library-expiration">
            <summary>查看到期盈亏</summary>
            <ul class="expiration-list">
              ${item.expiration.map((line) => `<li>${line}</li>`).join("")}
            </ul>
          </details>
          <p>${item.why}</p>
          <div class="library-meta">
            ${greekTags(item.greeks)}
            <span class="tag risk">${item.risk}</span>
          </div>
          <details>
            <summary>查看使用边界</summary>
            <p>${item.avoid}</p>
          </details>
        </article>
      `;
    })
    .join("");
}

function renderCases() {
  if (!activeCases.length) drawPracticeCases();
  document.querySelector("#case-list").innerHTML = activeCases
    .map(
      (item, index) => `
        <article class="case-card" data-case="${index}">
          <div>
            <h2>${item.title}</h2>
            <p>${item.prompt}</p>
            <div class="case-options">
              ${item.options
                .map(
                  (key) => `
                    <button class="case-option" type="button" data-answer="${key}">
                      ${strategyLabel(key)}
                    </button>
                  `
                )
                .join("")}
            </div>
          </div>
          <aside class="case-answer" aria-live="polite">
            <strong>Pick a Strategy</strong>
            <span>答案会显示在这里。</span>
          </aside>
        </article>
      `
    )
    .join("");
}

function drawPracticeCases() {
  const shuffled = [...cases];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  activeCases = shuffled.slice(0, CASE_PRACTICE_SIZE);
}

function resetCases() {
  drawPracticeCases();
  renderCases();
  scrollCasesIntoView();
}

function answerCase(button) {
  const card = button.closest(".case-card");
  const item = activeCases[Number(card.dataset.case)];
  const selected = button.dataset.answer;
  const isRight = selected === item.answer;

  card.querySelectorAll(".case-option").forEach((option) => {
    option.classList.remove("is-right", "is-wrong");
    if (option !== button) return;
    option.classList.add(isRight ? "is-right" : "is-wrong");
  });

  const answerPanel = card.querySelector(".case-answer");
  answerPanel.classList.remove("is-correct", "is-better");
  answerPanel.classList.add(isRight ? "is-correct" : "is-better");
  answerPanel.innerHTML = `
    <strong>${isRight ? "Correct" : "Better Answer"}: ${strategyLabel(item.answer)}</strong>
    <span>${item.reason}</span>
  `;
}

document.addEventListener("click", (event) => {
  const themeToggle = event.target.closest("#theme-toggle");
  if (themeToggle) toggleTheme();

  const choice = event.target.closest(".choice");
  if (choice && !choice.disabled) selectChoice(choice);

  const tab = event.target.closest(".tab");
  if (tab) switchView(tab.dataset.view);

  const paContext = event.target.closest(".pa-context-card");
  if (paContext) applyPaContext(paContext.dataset.paContext);

  const viewLink = event.target.closest("[data-view-link]");
  if (viewLink) {
    event.preventDefault();
    switchView(viewLink.dataset.viewLink);
  }

  const caseOption = event.target.closest(".case-option");
  if (caseOption) answerCase(caseOption);

  const caseReset = event.target.closest("#case-reset-button");
  if (caseReset) resetCases();
});

applyTheme(safeGetTheme());

document.querySelector("#reset-button").addEventListener("click", resetGuide);

renderLibrary();
drawPracticeCases();
renderCases();
renderPaContexts();

const startingView = window.location.hash.replace("#", "");
renderTerms();

if (["terms", "guide", "library", "cases"].includes(startingView)) {
  switchView(startingView);
}

window.addEventListener("hashchange", () => {
  const nextView = window.location.hash.replace("#", "");
  if (["terms", "guide", "library", "cases"].includes(nextView)) switchView(nextView);
});
