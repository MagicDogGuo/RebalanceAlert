const SYMBOLS = [
  { id: '0050', label: '元大台灣50 (0050)' },
  { id: '00631L', label: '元大台灣50正2 (00631L)' },
];

const form = document.getElementById('holdings-form');
const submitBtn = document.getElementById('submit-btn');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

function formatCurrency(amount) {
  const rounded = Math.round(amount);
  return `$${rounded.toLocaleString('en-US')} 元`;
}

function formatPrice(amount) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元`;
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function formatLeverage(value) {
  return `${value.toFixed(3)} 倍`;
}

function priceSourceLabel(source) {
  return source === 'finmind' ? 'FinMind API' : '防禦預設股價';
}

function setStatus(message, type) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
  statusEl.className = 'status';
}

function createInfoRow(label, value, valueClass = '') {
  return `
    <div class="info-row">
      <dt>${label}</dt>
      <dd class="${valueClass}">${value}</dd>
    </div>
  `;
}

function renderPrices(prices) {
  const container = document.getElementById('prices');
  container.innerHTML = SYMBOLS.map(({ id, label }) => {
    const quote = prices[id];
    return createInfoRow(
      label,
      `${formatPrice(quote.close)}（${quote.date}，${priceSourceLabel(quote.source)}）`,
    );
  }).join('');
}

function renderSummary(summary) {
  const pnlClass = summary.unrealizedPnL >= 0 ? 'pnl-positive' : 'pnl-negative';
  const container = document.getElementById('summary');
  container.innerHTML = [
    createInfoRow('總市值', formatCurrency(summary.totalMarketValue)),
    createInfoRow('總曝險', formatCurrency(summary.totalExposure)),
    createInfoRow('整體槓桿', formatLeverage(summary.leverage), 'highlight-leverage'),
    createInfoRow('總成本', formatCurrency(summary.totalCost)),
    createInfoRow('未實現損益', formatCurrency(summary.unrealizedPnL), pnlClass),
    createInfoRow('投資報酬率', formatPercent(summary.roiPercent), pnlClass),
  ].join('');
}

function renderBreakdown(breakdown) {
  const container = document.getElementById('breakdown');
  container.innerHTML = breakdown
    .map((item) => {
      const label = SYMBOLS.find((s) => s.id === item.symbol)?.label ?? item.symbol;
      return `
        <article class="breakdown-item">
          <h4>${label}</h4>
          <div class="info-grid">
            ${createInfoRow('持有股數', `${item.shares.toLocaleString('en-US')} 股`)}
            ${createInfoRow('市值', formatCurrency(item.marketValue))}
            ${createInfoRow('市值權重', formatPercent(item.weightPercent))}
            ${createInfoRow('曝險倍數', `${item.exposureMultiplier} 倍`)}
            ${createInfoRow('曝險金額', formatCurrency(item.exposure))}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderWarnings(warnings) {
  const section = document.getElementById('warnings');
  const list = document.getElementById('warnings-list');

  if (!warnings.length) {
    section.hidden = true;
    list.innerHTML = '';
    return;
  }

  section.hidden = false;
  list.innerHTML = warnings.map((w) => `<li>${w}</li>`).join('');
}

function renderResult(data) {
  renderPrices(data.prices);
  renderSummary(data.summary);
  renderBreakdown(data.breakdown);
  renderWarnings(data.warnings);
  resultEl.hidden = false;
}

function getHoldingsFromForm() {
  return {
    holdings: {
      '0050': {
        shares: Number(document.getElementById('shares-0050').value),
        costPerShare: Number(document.getElementById('cost-0050').value),
      },
      '00631L': {
        shares: Number(document.getElementById('shares-00631L').value),
        costPerShare: Number(document.getElementById('cost-00631L').value),
      },
    },
  };
}

function setHoldingsInForm(holdings) {
  document.getElementById('shares-0050').value = holdings['0050'].shares;
  document.getElementById('cost-0050').value = holdings['0050'].costPerShare;
  document.getElementById('shares-00631L').value = holdings['00631L'].shares;
  document.getElementById('cost-00631L').value = holdings['00631L'].costPerShare;
}

async function loadSavedHoldings() {
  try {
    const response = await fetch('/api/v1/holdings');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? '讀取持股資料失敗');
    }

    if (data.holdings) {
      setHoldingsInForm(data.holdings);
    }
  } catch (error) {
    setStatus(error.message ?? '讀取已儲存持股失敗', 'error');
  }
}

loadSavedHoldings();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  resultEl.hidden = true;
  submitBtn.disabled = true;
  setStatus('正在取得最新股價並計算，請稍候…', 'loading');

  try {
    const response = await fetch('/api/v1/calculate-leverage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getHoldingsFromForm()),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? '計算失敗，請稍後再試');
    }

    clearStatus();
    renderResult(data);
  } catch (error) {
    setStatus(error.message ?? '發生未知錯誤', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
