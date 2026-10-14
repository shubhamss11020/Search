import os
import shutil
import uuid
from typing import Tuple
from fastapi import UploadFile
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.mode = settings.STORAGE_MODE
        self.upload_dir = settings.UPLOAD_DIR
        if self.mode == "local":
            os.makedirs(self.upload_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, user_id: str) -> Tuple[str, int]:
        """
        Saves uploaded resume file and returns (storage_key, file_size_bytes)
        """
        user_folder = os.path.join(self.upload_dir, str(user_id))
        os.makedirs(user_folder, exist_ok=True)

        file_ext = os.path.splitext(file.filename or "")[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        destination_path = os.path.join(user_folder, unique_filename)

        file_size = 0
        with open(destination_path, "wb") as buffer:
            # Read in chunks to handle larger PDFs gracefully
            while content := await file.read(1024 * 64):
                file_size += len(content)
                buffer.write(content)

        # Store relative file_key
        storage_key = os.path.join(str(user_id), unique_filename).replace("\\", "/")
        return storage_key, file_size

    def get_file_path(self, file_key: str) -> str:
        """
        Resolves local storage path.
        """
        return os.path.join(self.upload_dir, file_key)

    def delete_file(self, file_key: str) -> bool:
        path = self.get_file_path(file_key)
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception:
                return False
        return False

    def delete_user_files(self, user_id: str) -> None:
        user_folder = os.path.join(self.upload_dir, str(user_id))
        if os.path.exists(user_folder):
            try:
                shutil.rmtree(user_folder)
            except Exception:
                pass

storage_service = StorageService()
