-- Migration to fix security vulnerability in category CRUD functions
-- Issue: Functions with SECURITY DEFINER don't check user permissions
-- Solution: Add authentication and role checks (Reviewer or Coordinator required)

-- =====================================================
-- Step 1: DROP old vulnerable function signatures
-- =====================================================

DROP FUNCTION IF EXISTS public.create_category(TEXT, UUID, version_status);
DROP FUNCTION IF EXISTS public.update_category(UUID, TEXT, UUID, version_status);
DROP FUNCTION IF EXISTS public.delete_category(UUID);

-- =====================================================
-- Step 2: CREATE new secure function signatures
-- =====================================================

-- =====================================================
-- 1. Fix create_category - Requires Reviewer or Coordinator
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_category(
  _name TEXT,
  _parent_category_id UUID DEFAULT NULL,
  _default_visibility version_status DEFAULT 'approved'
)
RETURNS UUID AS $$
DECLARE
  current_user_id uuid := auth.uid();
  _new_category_id UUID;
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if the user has the right permissions (Reviewer or Coordinator only)
  IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions to create categories';
  END IF;

  -- Create the category
  INSERT INTO public.categories (name, parent_category_id, default_visibility)
  VALUES (_name, _parent_category_id, _default_visibility)
  RETURNING id INTO _new_category_id;

  RETURN _new_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 2. Fix update_category - Requires Reviewer or Coordinator
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_category(
  _id UUID,
  _name TEXT,
  _parent_category_id UUID DEFAULT NULL,
  _default_visibility version_status DEFAULT 'approved'
)
RETURNS VOID AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if the user has the right permissions (Reviewer or Coordinator only)
  IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions to update categories';
  END IF;

  -- Update the category
  UPDATE public.categories
  SET name = _name,
      parent_category_id = _parent_category_id,
      default_visibility = _default_visibility
  WHERE id = _id;

  -- Check if any rows were updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 3. Fix delete_category - Requires Reviewer or Coordinator
-- =====================================================
CREATE OR REPLACE FUNCTION public.delete_category(_id UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if the user has the right permissions (Reviewer or Coordinator only)
  IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete categories';
  END IF;

  -- Delete the category
  DELETE FROM public.categories WHERE id = _id;

  -- Check if any rows were deleted
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
