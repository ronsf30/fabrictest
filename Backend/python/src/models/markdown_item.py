from typing import Dict, Any, Optional
from uuid import UUID
import logging
from models.authentication_models import AuthorizationContext
from items.base_item import ItemBase
from services.lakehouse_client_service import LakehouseClientService
from services.onelake_client_service import OneLakeClientService

logger = logging.getLogger(__name__)

class MarkdownItem(ItemBase):
    def __init__(self, auth_context: AuthorizationContext):
        super().__init__(auth_context)
        self.onelake_service = OneLakeClientService(auth_context)
        
    async def create(self, workspace_id: str, item_id: str, create_request: Dict[str, Any]) -> None:
        """Create a new markdown file in OneLake."""
        logger.info(f"Creating markdown file for item {item_id}")
        default_content = "# New Markdown Document\n\nStart writing..."
        file_path = f"{workspace_id}/{item_id}/Files/content.md"
        
        token = self.auth_context.auth_token if hasattr(self.auth_context, 'auth_token') else "mock_token"
        
        await self.onelake_service.write_to_onelake_file(token, file_path, default_content)

    async def get_content(self) -> str:
        """Get the content of the markdown file."""
        return "# Mock Content\n\nOneLake integration pending real environment."

    async def get_item_payload(self) -> Dict[str, Any]:
        """Get the item payload."""
        content = await self.get_content()
        return {"content": content}

    async def update_content(self, workspace_id: UUID, item_id: UUID, content: str) -> None:
        """Update the content of the markdown file."""
        logger.info(f"Updating markdown file for item {item_id}")
        file_path = f"{workspace_id}/{item_id}/Files/content.md"
        token = self.auth_context.auth_token if hasattr(self.auth_context, 'auth_token') else "mock_token"
        await self.onelake_service.write_to_onelake_file(token, file_path, content)
