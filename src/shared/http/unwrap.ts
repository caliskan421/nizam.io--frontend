import { ApiError, normalizeErrorResponse, toApiError } from '@/shared/errors/api-error'

type ResultLike<D> = { data?: D; error?: unknown; response: Response }

/**
 * openapi-fetch sonucunu veriye çevirir; her başarısızlık normalize `ApiError` olarak fırlar
 * (HTTP hatası → sunucu kodu; ağ hatası → client.network_error; bozuk JSON →
 * client.invalid_response).
 */
export async function unwrap<D>(promise: Promise<ResultLike<D>>): Promise<D> {
  let result: ResultLike<D>
  try {
    result = await promise
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError({ code: 'client.invalid_response', cause: error })
    }
    throw toApiError(error)
  }
  if (result.response.ok) return result.data as D
  throw normalizeErrorResponse(result.response, result.error)
}
