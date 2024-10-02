export const getPagination = ({
  totalItems,
  page,
  limit,
}: {
  totalItems: number;
  page: number;
  limit: number;
}) => ({
  totalItems: +totalItems,
  limit: +limit,
  page: +page,
});
