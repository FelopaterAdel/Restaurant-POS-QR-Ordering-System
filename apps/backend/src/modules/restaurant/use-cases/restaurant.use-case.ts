import { RestaurantRepository, type Restaurant } from "../repositories/restaurant.repository.js";
import {
  updateRestaurantSchema,
  type UpdateRestaurantInput,
} from "../schemas/update-restaurant.schema.js";

export class GetRestaurantUseCase {
  private readonly repository: RestaurantRepository;

  constructor(repository: RestaurantRepository = new RestaurantRepository()) {
    this.repository = repository;
  }

  async execute(): Promise<Restaurant | null> {
    return this.repository.find();
  }
}

export class UpdateRestaurantUseCase {
  private readonly repository: RestaurantRepository;

  constructor(repository: RestaurantRepository = new RestaurantRepository()) {
    this.repository = repository;
  }

  async execute(input: UpdateRestaurantInput): Promise<Restaurant> {
    const data = updateRestaurantSchema.parse(input);
    return this.repository.upsert(data);
  }
}
