import { iterateDescriptors } from "js-partial-classes";

/**
 * Base class for creating partial pages that can be supplemented into main page classes.
 * Uses the partial-classes dependency for method injection and API handler registration.
 * 
 * @class PartialPage
 * @example
 * import { PartialPage } from '@prkeshri/node-codebehind';
 * 
 * class ValidationPartial extends PartialPage {
 *   validateEmail(email) {
 *     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 *   }
 *   
 *   validateRequired(value) {
 *     return value !== null && value !== undefined && value !== '';
 *   }
 * }
 * 
 * // Usage in main page class
 * class HomePage extends Page {
 *   static {
 *     supplement(this, ValidationPartial);
 *   }
 * }
 */
class PartialPage {
  static {
    this.isPartial = true;
  }

  /**
   * Registers all prototype methods as API handlers.
   * This method is called automatically to mark methods for server-side event handling.
   * 
   * @static
   * @example
   * class MyPartial extends PartialPage {
   *   static handlers();
   *   
   *   myMethod() {
   *     // This method will be automatically registered as an API handler
   *     return 'Hello from partial!';
   *   }
   * }
   */
  static handlers() {
    iterateDescriptors(this.prototype, ([, value]) => {
      value.value.apiHandler = true;
    });
  }
}

export default PartialPage;
