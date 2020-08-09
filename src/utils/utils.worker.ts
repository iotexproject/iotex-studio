export const getFile = async ({ url }) => {
  const res = fetch(url);
  return res;
};
