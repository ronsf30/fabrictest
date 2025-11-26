import logging
from typing import Dict, Type
from models.authentication_models import AuthorizationContext
from items.base_item import ItemBase

from constants.workload_constants import WorkloadConstants
from exceptions.exceptions import UnexpectedItemTypeException

logger = logging.getLogger(__name__)

class ItemFactory:
    
    if not registry.has(ItemFactory):
        if not hasattr(get_item_factory, "instance"):
            get_item_factory.instance = ItemFactory()
        return get_item_factory.instance
    
    return registry.get(ItemFactory)