const STORAGE_KEY = "salary_increment_calculator";

const form = document.getElementById("calculator-form");
const message = document.getElementById("form-message");
const resultsSection = document.getElementById("results");

const currentSalaryInput = document.getElementById("current-salary");
const expectedIncrementInput = document.getElementById("expected-increment");
const actualIncrementInput = document.getElementById("actual-increment");
const effectiveDateInput = document.getElementById("effective-date");
const appliedDateInput = document.getElementById("applied-date");

const resultNewSalary = document.getElementById("result-new-salary");
const resultMonthlyIncrement = document.getElementById("result-monthly-increment");
const resultPending = document.getElementById("result-pending");
const resultExtra = document.getElementById("result-extra");
const resultRecovery = document.getElementById("result-recovery");
const breakdownContent = document.getElementById("breakdown-content");

const formatCurrency = (value) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const monthsBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  let totalMonths = yearDiff * 12 + monthDiff;

  if (end.getDate() < start.getDate()) {
    totalMonths -= 1;
  }

  return Math.max(totalMonths, 0);
};

const readNumber = (input) => Number.parseFloat(input.value.trim());

const showMessage = (text) => {
  message.textContent = text;
};

const saveLastCalculation = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadLastCalculation = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse saved calculation", error);
    return null;
  }
};

const renderResults = (results) => {
  resultNewSalary.textContent = formatCurrency(results.newSalary);
  resultMonthlyIncrement.textContent = formatCurrency(results.monthlyIncrement);
  resultPending.textContent = formatCurrency(results.pendingAmount);
  resultExtra.textContent = formatCurrency(results.extraPerMonth);
  resultRecovery.textContent =
    results.recoveryMonths === Infinity
      ? "Not recoverable"
      : `${results.recoveryMonths} month(s)`;

  breakdownContent.innerHTML = results.breakdown
    .map((line) => `<div>${line}</div>`)
    .join("");

  resultsSection.hidden = false;
};

const validateInputs = () => {
  const salary = readNumber(currentSalaryInput);
  const expected = readNumber(expectedIncrementInput);
  const actual = readNumber(actualIncrementInput);
  const effectiveDate = effectiveDateInput.value;
  const appliedDate = appliedDateInput.value;

  if (!salary || salary <= 0) {
    return "Please enter a valid current salary.";
  }

  if (!Number.isFinite(expected) || expected < 0) {
    return "Expected increment must be 0 or higher.";
  }

  if (!Number.isFinite(actual) || actual < 0) {
    return "Actual increment must be 0 or higher.";
  }

  if (!effectiveDate || !appliedDate) {
    return "Please choose both dates.";
  }

  if (new Date(appliedDate) < new Date(effectiveDate)) {
    return "Applied date cannot be before the effective date.";
  }

  return "";
};

const calculateResults = () => {
  const salary = readNumber(currentSalaryInput);
  const expectedPercent = readNumber(expectedIncrementInput);
  const actualPercent = readNumber(actualIncrementInput);
  const effectiveDate = effectiveDateInput.value;
  const appliedDate = appliedDateInput.value;

  const expectedSalary = salary * (1 + expectedPercent / 100);
  const actualSalary = salary * (1 + actualPercent / 100);
  const monthlyIncrement = actualSalary - salary;

  const delayMonths = monthsBetween(effectiveDate, appliedDate);
  const pendingAmount = monthlyIncrement * delayMonths;

  const extraPerMonth = expectedSalary - actualSalary;
  const recoveryMonths = extraPerMonth > 0 ? Math.ceil(pendingAmount / extraPerMonth) : Infinity;

  return {
    newSalary: actualSalary,
    monthlyIncrement,
    pendingAmount,
    extraPerMonth,
    recoveryMonths,
    breakdown: [
      `Delay months: ${delayMonths}`,
      `Expected salary: ${formatCurrency(expectedSalary)}`,
      `Actual salary: ${formatCurrency(actualSalary)}`,
      `Pending amount: ${formatCurrency(monthlyIncrement)} × ${delayMonths} month(s)`,
      `Extra per month: ${formatCurrency(extraPerMonth)}`,
    ],
    inputs: {
      salary,
      expectedPercent,
      actualPercent,
      effectiveDate,
      appliedDate,
    },
  };
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("");

  const error = validateInputs();
  if (error) {
    showMessage(error);
    resultsSection.hidden = true;
    return;
  }

  const results = calculateResults();
  renderResults(results);
  saveLastCalculation({ inputs: results.inputs, results });
});

const hydrateFromStorage = () => {
  const saved = loadLastCalculation();
  if (!saved) return;

  const { inputs, results } = saved;
  currentSalaryInput.value = inputs.salary ?? "";
  expectedIncrementInput.value = inputs.expectedPercent ?? "";
  actualIncrementInput.value = inputs.actualPercent ?? "";
  effectiveDateInput.value = inputs.effectiveDate ?? "";
  appliedDateInput.value = inputs.appliedDate ?? "";

  if (results) {
    renderResults(results);
  }
};

hydrateFromStorage();
