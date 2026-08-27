import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { FavoritesBackupModal } from '../../src/components/favorite/FavoritesBackupModal';

describe('FavoritesBackupModal component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders modal with export and import controls when open', () => {
    render(
      <LanguageProvider>
        <FavoritesBackupModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText(/我的最愛管理與資料備份/i)).toBeInTheDocument();
    expect(screen.getByText(/下載備份檔案/i)).toBeInTheDocument();
    expect(screen.getByText(/複製備份代碼/i)).toBeInTheDocument();
    expect(screen.getByText(/選擇備份檔案上傳/i)).toBeInTheDocument();
    expect(screen.getByText(/確認匯入/i)).toBeInTheDocument();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <LanguageProvider>
        <FavoritesBackupModal isOpen={false} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('successfully imports valid JSON from textarea', () => {
    const onSuccessMock = vi.fn();
    render(
      <LanguageProvider>
        <FavoritesBackupModal isOpen={true} onClose={() => {}} onSuccess={onSuccessMock} />
      </LanguageProvider>
    );

    const textarea = screen.getByPlaceholderText(/請在此貼上備份/i);
    const validJson = JSON.stringify({
      version: 1,
      favoriteTeams: [119, 147],
      favoritePlayers: [660271, 678906],
    });

    fireEvent.change(textarea, { target: { value: validJson } });

    const submitBtn = screen.getByText(/確認匯入/i);
    fireEvent.click(submitBtn);

    expect(screen.getByText(/收藏資料匯入成功/i)).toBeInTheDocument();
    expect(onSuccessMock).toHaveBeenCalled();
  });
});
