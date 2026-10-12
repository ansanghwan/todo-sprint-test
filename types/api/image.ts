/** 이미지 업로드 URL 발급(POST /{teamId}/images) 응답 DTO입니다. */
export interface ImageUploadUrlDto {
  /** 파일을 PUT으로 올릴 presigned URL */
  uploadUrl: string;
  /** 업로드 후 다른 API(fileUrl 등)에 넣을 파일 URL */
  url: string;
}
