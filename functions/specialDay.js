const observances = {
  "01-01": {
    name: "New Year's Day",
    file: "new_year.png",
  },
  "01-24": {
    name: "International Day of Education",
    file: "education.png",
  },
  "03-08": {
    name: "International Women's Day",
    file: "womens.png",
  },
  "05-15": {
    name: "International Day of Families",
    file: "families.png",
  },
  "06-01_to_06-30": {
    name: "Pride Month",
    file: "pride_month.png",
  },
  "06-05": {
    name: "World Environment Day",
    file: "world_environment.png",
  },
  "06-08": {
    name: "World Oceans Day",
    file: "world_oceans.png",
  },
  "06-17": {
    name: "World Day to Combat Desertification and Drought",
    file: "desertification_drought.png",
  },
  "06-28": {
    name: "International LGBTQ+ Pride Day",
    file: "pride_day.png",
  },
  "07-01": {
    name: "Canada Day",
    file: "canada_day.png",
  },
  "07-04": {
    name: "Independence Day",
    file: "independence_day.png",
  },
  "09-21": {
    name: "International Day of Peace",
    file: "peace.png",
  },
  "11-19": {
    name: "International Men's Day",
    file: "mens.png",
  },
  "12-10": {
    name: "Human Rights Day",
    file: "human_rights.png",
  },
  "12-25": {
    name: "Christmas Day",
    file: "christmas.png",
  },
  "12-31": {
    name: "New Year's Eve",
    file: "new_year.png",
  },
};

function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function isInRange(range, today) {
  const [start, end] = range.split("_to_");
  return start <= today && today <= end;
}

function getTodayEvent() {
  const today = formatDate(new Date());

  for (const key in observances) {
    if (key.includes("_to_")) {
      if (isInRange(key, today)) return observances[key];
    } else {
      if (key === today) return observances[key];
    }
  }

  return null;
}

module.exports = { getTodayEvent };
