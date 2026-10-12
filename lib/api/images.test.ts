import axios, {
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from './client-fetcher';
import { ApiError } from './errors';
import { uploadImage } from './images';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

const UPLOAD_URL = 'https://storage.example.com/upload?signature=abc';
const FILE_URL = 'https://cdn.example.com/images/photo.png';

const replyUploadUrl = () => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return {
      data: { uploadUrl: UPLOAD_URL, url: FILE_URL },
      status: 200,
      statusText: '',
      headers: {},
      config,
    };
  };
  api.defaults.adapter = adapter;
  return sent;
};

describe('uploadImage', () => {
  it('업로드 URL을 발급받아 파일을 PUT하고 파일 URL을 돌려준다', async () => {
    const sent = replyUploadUrl();
    const put = vi.spyOn(axios, 'put').mockResolvedValue({});
    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    const url = await uploadImage(file);

    expect(sent[0].url).toBe('/images');
    expect(sent[0].method).toBe('post');
    expect(JSON.parse(sent[0].data)).toEqual({ fileName: 'photo.png' });
    expect(put).toHaveBeenCalledWith(UPLOAD_URL, file, {
      headers: { 'Content-Type': 'image/png' },
    });
    expect(url).toBe(FILE_URL);
  });

  it('PUT이 실패하면 ApiError로 알린다', async () => {
    replyUploadUrl();
    vi.spyOn(axios, 'put').mockRejectedValue(
      new axios.AxiosError('Network Error', 'ERR_NETWORK'),
    );
    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    await expect(uploadImage(file)).rejects.toBeInstanceOf(ApiError);
  });
});
