/**
 * @file Custom each helper for Handlebars with enhanced object iteration support
 *
 * Provides an enhanced iteration helper that:
 * - Supports arrays and objects
 * - Maintains index tracking
 * - Handles nested paths
 * - Supports empty value handling
 * - Provides iteration metadata
 *
 * Functions:
 * - each: Main iteration function
 * - processContext: Context processing helper
 * - createIterationData: Metadata creation helper
 *
 * Constants:
 * - HANDLEBARS_CONFIG: Configuration for error messages and styling
 * - ITERATION_METADATA: Default metadata configuration
 *
 * Flow:
 * 1. Validate and process input context
 * 2. Handle empty or invalid contexts
 * 3. Create iteration metadata
 * 4. Process each item with proper context
 * 5. Return combined results
 *
 * Error Handling:
 * - Handles null/undefined contexts
 * - Provides empty value handling
 * - Logs iteration errors
 * - Returns safe HTML for errors
 *
 * @module @/utils/template-processor/handlebars/helpers/array/each
 * @requires handlebars
 * @requires @/utils/common/logger
 * @requires @/config/handlebars-config
 */

const handlebars = require('handlebars');
const { logger } = require('@/utils/common/logger');

/**
 * Converts an object with numeric keys into an array
 * @param {object} obj - The object to convert
 * @returns {Array|object} The resulting array or original object if no conversion needed
 * @throws {Error} If conversion fails
 */
function objectToArray(obj) {
  try {
    logger.debug('objectToArray input:', {
      obj,
      type: typeof obj,
      keys: obj ? Object.keys(obj) : [],
      isArray: Array.isArray(obj),
    });

    // If it's already an array or not an object, return as is
    if (Array.isArray(obj) || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Get numeric keys and sort them
    const keys = Object.keys(obj);
    const numericKeys = keys
      .filter((key) => !isNaN(key))
      .sort((a, b) => parseInt(a) - parseInt(b));

    // If no numeric keys, return original object
    if (numericKeys.length === 0) {
      // If it's an empty object, return empty array for consistent handling
      if (keys.length === 0) {
        return [];
      }
      return obj;
    }

    logger.debug('Processing numeric keys:', { numericKeys });

    // Create array and fill gaps with empty strings
    const maxIndex = Math.max(...numericKeys.map((k) => parseInt(k)));
    const result = new Array(maxIndex + 1).fill('');

    // Fill in the values
    numericKeys.forEach((key) => {
      const value = obj[key];
      result[parseInt(key)] = value;
    });

    logger.debug('Converted array:', { result });
    return result;
  } catch (error) {
    logger.error('Error in objectToArray:', {
      error,
      input: obj,
    });
    // On error, return original object to avoid breaking the template
    return obj;
  }
}

/**
 * Recursively processes child properties in objects
 * @param {*} item - The item to process
 * @returns {*} The processed item
 */
function processChild(item) {
  try {
    if (item && typeof item === 'object' && 'child' in item) {
      // Convert the immediate child property
      item.child = objectToArray(item.child);

      // If child is an array, recursively process each element
      if (Array.isArray(item.child)) {
        item.child = item.child.map(processChild);
      }
      // If child is an object, recursively process its properties
      else if (typeof item.child === 'object' && item.child !== null) {
        Object.keys(item.child).forEach((key) => {
          item.child[key] = processChild(item.child[key]);
        });
      }
    }
    return item;
  } catch (error) {
    logger.error('Error in processChild:', {
      error,
      item,
    });
    // On error, return original item to avoid breaking the template
    return item;
  }
}

/**
 * Custom each helper that handles both arrays and objects with numeric keys
 * @param {object|Array} context - The context to iterate over
 * @param {object} options - Handlebars options object
 * @returns {string} The processed template
 */
function eachHelper(context, options) {
  try {
    logger.debug('eachHelper called with:', {
      context,
      type: typeof context,
      isArray: Array.isArray(context),
      hasChild: context && typeof context === 'object' && 'child' in context,
    });

    // Handle empty or falsy context
    if (!context || (Array.isArray(context) && context.length === 0)) {
      logger.debug('Empty context, invoking inverse block if available');
      return typeof options.inverse === 'function' ? options.inverse(this) : '';
    }

    let result = '';
    let data;

    if (options.data) {
      data = handlebars.createFrame(options.data);
    }

    // If context is an object with a 'child' property that has numeric keys
    if (context && typeof context === 'object' && 'child' in context) {
      logger.debug('Processing object with child property:', {
        child: context.child,
      });
      context = objectToArray(context.child);
    }
    // Otherwise, if it's an object with numeric keys, convert it to array
    else if (typeof context === 'object' && !Array.isArray(context)) {
      const converted = objectToArray(context);
      // Only use converted array if it's different from the original object
      context = Array.isArray(converted) ? converted : context;
    }

    // After conversion, check again for empty array
    if (
      Array.isArray(context) &&
      context.length === 0 &&
      typeof options.inverse === 'function'
    ) {
      return options.inverse(this);
    }

    if (Array.isArray(context)) {
      for (let i = 0; i < context.length; i++) {
        // Create new frame for each iteration
        const itemData = handlebars.createFrame(data || {});
        // Set index directly without wrapping
        itemData.index = i;
        itemData.first = i === 0;
        itemData.last = i === context.length - 1;
        itemData.key = i.toString();
        itemData.currentPath = data?.currentPath
          ? `${data.currentPath}.${i}`
          : `${i}`;

        let item = context[i];

        // Process child properties recursively
        if (item && typeof item === 'object' && item !== null) {
          item = processChild(item);
        }

        result += options.fn(item, { data: itemData });
      }
    } else if (typeof context === 'object') {
      // Handle regular objects
      const keys = Object.keys(context);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // Create new frame for each iteration
        const itemData = handlebars.createFrame(data || {});
        // Set index directly without wrapping
        itemData.index = i;
        itemData.key = key;
        itemData.first = i === 0;
        itemData.last = i === keys.length - 1;
        itemData.currentPath = data?.currentPath
          ? `${data.currentPath}.${key}`
          : key;

        let value = context[key];

        // Process child properties recursively
        if (value && typeof value === 'object' && value !== null) {
          value = processChild(value);
        }

        result += options.fn(value, { data: itemData });
      }
    }

    return result;
  } catch (error) {
    logger.error('Error in eachHelper:', {
      error,
      context,
    });
    // On error, return empty string to avoid breaking the template
    return '';
  }
}

module.exports = {
  eachHelper,
  objectToArray,
  processChild, // Exported for testing
};
