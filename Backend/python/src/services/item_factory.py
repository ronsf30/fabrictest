import logging
from typing import Dict, Type
from models.authentication_models import AuthorizationContext
from items.base_item import ItemBase
from models.markdown_item import MarkdownItem

from constants.workload_constants import WorkloadConstants
from exceptions.exceptions import UnexpectedItemTypeException

logger = logging.getLogger(__name__)

class ItemFactory:
    @staticmethod
    def create_item(item_type: str, auth_context: AuthorizationContext) -> ItemBase:
        logger.info(f"Creating item of type {item_type}")
        if item_type == "Org.MarkdownDoc.Item":
            return MarkdownItem(auth_context)
        else:
            logger.error(f"Unexpected item type: {item_type}")
            raise UnexpectedItemTypeException(f"Items of type {item_type} are not supported")

def get_item_factory() -> ItemFactory:
    """Get the singleton ItemFactory instance."""
    from core.service_registry import get_service_registry
    registry = get_service_registry()
    
    if not registry.has(ItemFactory):
        if not hasattr(get_item_factory, "instance"):
            get_item_factory.instance = ItemFactory()
        return get_item_factory.instance
    
    return registry.get(ItemFactory)