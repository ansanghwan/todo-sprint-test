/** 파일 업로드 URL 발급(POST /{teamId}/files) 요청·응답 DTO입니다. 서버 스펙을 그대로 따릅니다. */

// ── 요청 ──
export interface CreateFileUploadUrlBodyDto {
  fileName: string;
}

// ── 응답 ──
export interface FileUploadUrlDto {
  /** 파일을 PUT으로 올릴 presigned URL */
  uploadUrl: string;
  /** 업로드 후 다른 API(fileUrl 등)에 넣을 파일 URL */
  url: string;
}
