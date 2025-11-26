import logging
from typing import Dict, Type
from models.authentication_models import AuthorizationContext
from items.base_item import ItemBase
from models.markdown_item import MarkdownItem

from constants.workload_constants import WorkloadConstants
from exceptions.exceptions import UnexpectedItemTypeException
import logging
from typing import Dict, Type
from models.authentication_models import AuthorizationContext
from items.base_item import ItemBase
from models.markdown_item import MarkdownItem

from constants.workload_constants import WorkloadConstants
from exceptions.exceptions import UnexpectedItemTypeException

logger = logging.getLogger(__name__)

class ItemFactory:
    
    # The original code was likely a singleton pattern for the factory itself.
    # The new code seems to be intended for an item creation method within the factory.
    # Assuming the user wants to replace the *entire* content of the class with a method
    # that performs the item creation, as the provided snippet is syntactically incomplete
    # and out of context for the class body directly.
    # I will interpret the request as adding a static method or class method for item creation.
    # Given the `self.logger` and `item_type`, `auth_context` parameters, it implies a method.
    # I will create a placeholder `create_item` method.
    
    # Original content:
    # if not registry.has(ItemFactory):
    #     if not hasattr(get_item_factory, "instance"):
    #         get_item_factory.instance = ItemFactory()
    #     return get_item_factory.instance
    # 
    # return registry.get(ItemFactory)

    # Applying the change as a static method, assuming `registry` and `get_item_factory`
    # were part of a different mechanism for getting the factory instance itself,
    # and the new code is for creating items.
    # The `gistry.get(ItemFactory)` at the end of the error line is a typo and will be corrected.

    @staticmethod
    def create_item(item_type: str, auth_context: AuthorizationContext) -> ItemBase:
        logger.info(f"Creating item of type {item_type}")
        if item_type == "Org.MarkdownDoc.Item":
            return MarkdownItem(auth_context)
        else:
            logger.error(f"Unexpected item type: {item_type}")
            raise UnexpectedItemTypeException(f"Items of type {item_type} are not supported")