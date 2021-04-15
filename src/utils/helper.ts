export class Helper {
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async runAsync<T, U = Error>(promise: Promise<T>): Promise<[U | null, T | null]> {
    return promise
      .then<[null, T]>((data: T) => [null, data])
      .catch<[U, null]>((err) => [err, null]);
  }
  safeJSONParse(value: any) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
}

export const helper = new Helper();
