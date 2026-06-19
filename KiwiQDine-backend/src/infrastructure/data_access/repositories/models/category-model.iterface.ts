export interface ICategoryModel {
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly image?: string;
  readonly restaurantId: string;
}
