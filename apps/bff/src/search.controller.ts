import { Controller, Get, Query } from "@nestjs/common";
import { searchContent } from "./content-store.js";

@Controller("search")
export class SearchController {
  @Get()
  search(@Query("q") query = "") {
    return {
      query,
      items: searchContent(query)
    };
  }
}
