function getDatesBetweenWithRecurring(event) {
  let { startDate, endDate, recurringType } = event;

  recurringType =
    !recurringType || recurringType === "DOES NOT REPEAT"
      ? "DAILY"
      : recurringType.toUpperCase();

  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  // Decide increment
  let stepDays;
  switch (recurringType) {
    case "WEEKLY":
      stepDays = 7;
      break;
    case "BIWEEKLY":
      stepDays = 14;
      break;
    case "MONTHLY":
      stepDays = "MONTHLY";
      break;
    case "DAILY":
    default:
      stepDays = 1;
  }

  // Always include the starting date too
  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate).toISOString().split("T")[0]);

    if (stepDays === "MONTHLY") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + stepDays);
    }
  }

  return dates;
}

module.exports = { getDatesBetweenWithRecurring };
