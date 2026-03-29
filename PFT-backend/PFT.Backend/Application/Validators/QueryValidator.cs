using PFT.Backend.Common.Exceptions;

namespace PFT.Backend.Application.Validators;

public static class QueryValidator
{
    public static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        if (page <= 0)
        {
            throw new AppException("validation_error", "Page must be greater than 0.");
        }

        if (pageSize <= 0 || pageSize > 100)
        {
            throw new AppException("validation_error", "PageSize must be between 1 and 100.");
        }

        return (page, pageSize);
    }
}
