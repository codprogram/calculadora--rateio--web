const units = [
    { code: "6633", original: 670, final: 670 },
    { code: "4978", original: 612, final: 612 },
    { code: "7196", original: 130, final: 130 },
    { code: "6145", original: 187, final: 187 },
    { code: "8706", original: 201, final: 201 }
];

const unitsList = document.getElementById("unitsList");
const unitTemplate = document.getElementById("unitTemplate");
const addUnitButton = document.getElementById("addUnitButton");
const basePercentual = document.getElementById("basePercentual");
const summaryGrid = document.getElementById("summaryGrid");
const footerGrid = document.getElementById("footerGrid");
const statusBadge = document.getElementById("statusBadge");
const statusMessage = document.getElementById("statusMessage");

function parseNumber(value) {
    const parsed = Number.parseFloat(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
}

function formatSignedNumber(value) {
    if (value > 0) {
        return `+${formatNumber(value)}`;
    }
    return formatNumber(value);
}

function formatPercent(value) {
    const number = new Intl.NumberFormat("pt-BR", {
        minimumIntegerDigits: 2,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
    return `${number}%`;
}

function formatSignedPercent(value) {
    if (value > 0) {
        return `+${formatPercent(value)}`;
    }
    return formatPercent(value);
}

function totalOriginal() {
    return units.reduce((sum, unit) => sum + unit.original, 0);
}

function totalFinal() {
    return units.reduce((sum, unit) => sum + unit.final, 0);
}

function percentOriginal(unit, originalBase) {
    if (originalBase <= 0) {
        return 0;
    }
    return (unit.original / originalBase) * 100;
}

function percentFinal(unit, originalBase) {
    if (originalBase <= 0) {
        return 0;
    }
    return (unit.final / originalBase) * 100;
}

function badgeClass(status) {
    if (status === "erro") {
        return "status-error";
    }
    if (status === "alerta") {
        return "status-alert";
    }
    return "status-ok";
}

function statusData(original, final) {
    const balance = original - final;
    const hasNegative = units.some((unit) => unit.final < 0);

    if (hasNegative) {
        return {
            text: "Existe unidade com kWh final negativo. Ajuste os valores antes de compartilhar o cálculo.",
            badge: "Erro",
            kind: "erro"
        };
    }

    if (balance < 0) {
        return {
            text: `O total final ultrapassou o total original em ${formatNumber(Math.abs(balance))} kWh.`,
            badge: "Ultrapassou",
            kind: "erro"
        };
    }

    if (balance === 0) {
        return {
            text: "O total final está exatamente igual ao total original.",
            badge: "Fechado",
            kind: "ok"
        };
    }

    return {
        text: `Ainda restam ${formatNumber(balance)} kWh para distribuir sem ultrapassar o total original.`,
        badge: "Em ajuste",
        kind: "alerta"
    };
}

function summaryCards(original, final, finalPercent) {
    const balance = original - final;
    return [
        { title: "Total Original", value: formatNumber(original), note: "Base de 100%" },
        { title: "Total Final", value: formatNumber(final), note: "Soma editada" },
        { title: "Saldo Disponível", value: formatNumber(balance), note: balance < 0 ? "Ultrapassou o limite" : "Ainda pode distribuir" },
        { title: "Percentual Final", value: formatPercent(finalPercent), note: "Sobre a base original" }
    ];
}

function footerLines(original, final, originalPercent, finalPercent) {
    return [
        { label: "Soma kWh final", value: formatNumber(final), className: "" },
        {
            label: "Saldo disponível",
            value: formatNumber(original - final),
            className: original - final < 0 ? "negative" : "positive"
        },
        {
            label: "Soma % original",
            value: formatPercent(originalPercent),
            className: Math.abs(originalPercent - 100) < 0.01 ? "positive" : "negative"
        },
        {
            label: "Soma % final sobre a base original",
            value: formatPercent(finalPercent),
            className: finalPercent <= 100.01 ? "positive" : "negative"
        }
    ];
}

function renderSummary(original, final) {
    const finalPercent = original > 0 ? (final / original) * 100 : 0;
    const cards = summaryCards(original, final, finalPercent);

    summaryGrid.innerHTML = cards.map((card) => `
        <article class="summary-card">
            <span>${card.title}</span>
            <strong>${card.value}</strong>
            <small>${card.note}</small>
        </article>
    `).join("");
}

function renderFooter(original, final) {
    const originalPercent = units.reduce((sum, unit) => sum + percentOriginal(unit, original), 0);
    const finalPercent = units.reduce((sum, unit) => sum + percentFinal(unit, original), 0);
    const status = statusData(original, final);
    const lines = footerLines(original, final, originalPercent, finalPercent);

    footerGrid.innerHTML = lines.map((line) => `
        <div class="footer-line">
            <span>${line.label}</span>
            <strong class="${line.className}">${line.value}</strong>
        </div>
    `).join("");

    statusBadge.textContent = status.badge;
    statusBadge.className = `status-badge ${badgeClass(status.kind)}`;
    statusMessage.textContent = status.text;
    statusMessage.className = `status-message ${badgeClass(status.kind)}`;
}

function renderUnits() {
    unitsList.innerHTML = "";
    const original = totalOriginal();

    basePercentual.textContent = `Base percentual fixa: 100% = ${formatNumber(original)} kWh do total original`;

    units.forEach((unit, index) => {
        const fragment = unitTemplate.content.cloneNode(true);
        const card = fragment.querySelector(".unit-card");
        const label = fragment.querySelector(".unit-label");
        const codeInput = fragment.querySelector(".unit-code-input");
        const originalInput = fragment.querySelector(".input-original");
        const finalInput = fragment.querySelector(".input-final");
        const deleteButton = fragment.querySelector(".delete-button");
        const difference = fragment.querySelector(".metric-difference");
        const originalPercent = fragment.querySelector(".metric-original-percent");
        const finalPercent = fragment.querySelector(".metric-final-percent");
        const percentDelta = fragment.querySelector(".metric-percent-delta");

        const diffValue = unit.final - unit.original;
        const originalPct = percentOriginal(unit, original);
        const finalPct = percentFinal(unit, original);
        const deltaPct = finalPct - originalPct;

        label.textContent = `Unidade ${index + 1}`;
        codeInput.value = unit.code;
        originalInput.value = unit.original;
        finalInput.value = unit.final;

        difference.textContent = formatSignedNumber(diffValue);
        difference.className = `metric-difference ${diffValue >= 0 ? "positive" : "negative"}`;

        originalPercent.textContent = formatPercent(originalPct);
        originalPercent.className = "metric-original-percent neutral";

        finalPercent.textContent = formatPercent(finalPct);
        finalPercent.className = "metric-final-percent neutral";

        percentDelta.textContent = formatSignedPercent(deltaPct);
        percentDelta.className = `metric-percent-delta ${deltaPct >= 0 ? "positive" : "negative"}`;

        codeInput.addEventListener("input", (event) => {
            unit.code = event.target.value;
        });

        originalInput.addEventListener("input", (event) => {
            unit.original = parseNumber(event.target.value);
            renderApp();
        });

        finalInput.addEventListener("input", (event) => {
            unit.final = parseNumber(event.target.value);
            renderApp();
        });

        deleteButton.addEventListener("click", () => {
            units.splice(index, 1);
            renderApp();
        });

        unitsList.appendChild(card);
    });
}

function renderApp() {
    const original = totalOriginal();
    const final = totalFinal();

    renderUnits();
    renderSummary(original, final);
    renderFooter(original, final);
}

addUnitButton.addEventListener("click", () => {
    units.push({
        code: "",
        original: 0,
        final: 0
    });
    renderApp();
});

renderApp();
