// mappers/requisition-line.mapper.ts

import { RequisitionLineViewModel } from '../dto/requisition-line-view.model';

export class RequisitionLineMapper {
  static toViewModel(row: any): RequisitionLineViewModel {
    return {
      id: row.id,
      requisition_id: row.requisition_id,
      item_id: row.item_id,
      item_unit_id: row.item_unit_id,
      quantity: Number(row.quantity),
      created_at: row.created_at,
      updated_at: row.updated_at,
      return_of_line_id: row.return_of_line_id,
      source_location_id: row.source_location_id,
      destination_location_id: row.destination_location_id,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at,
      //item details
      name: row.item_name,
      brand: row.item_brand,
      model: row.item_model,
      internal_code: row.internal_code,
      location_id: row.location_id,
      status: row.status,
      //unit details
      unit_code: row.unit_code,
      unit_name: row.unit_name,
      //locations details
      source_location_name: row.source_location_name,
      destination_location_name: row.destination_location_name,
      //extra details
      photos_count: parseInt(row.photos_count, 10),
      has_return: row.has_return,
      accessories: row.accessories,
    };
  }

  static toViewModelList(rows: any[]): RequisitionLineViewModel[] {
    return rows.map(this.toViewModel);
  }
}
