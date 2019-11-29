export class PromiseHelper {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
