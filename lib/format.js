export const shortenId = (id, length = 10) => {
  const text = String(id || "");
  return text.length > length ? `${text.slice(0, length)}…` : text;
};
