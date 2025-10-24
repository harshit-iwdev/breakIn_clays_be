function normalizeDateString(dateStr) {
  // Expects "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("/");
  return new Date(Date.UTC(year, month - 1, day)); // 0-based months
}

module.exports = { normalizeDateString };
