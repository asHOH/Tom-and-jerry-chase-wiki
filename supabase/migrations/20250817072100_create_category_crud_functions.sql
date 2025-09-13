-- Function to create a new category
CREATE OR REPLACE FUNCTION public.create_category(
  _name TEXT,
  _parent_category_id UUID DEFAULT NULL,
  _default_visibility version_status DEFAULT 'approved'
)
RETURNS UUID AS $$
DECLARE
  _new_category_id UUID;
BEGIN
  INSERT INTO public.categories (name, parent_category_id, default_visibility)
  VALUES (_name, _parent_category_id, _default_visibility)
  RETURNING id INTO _new_category_id;

  RETURN _new_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an existing category
CREATE OR REPLACE FUNCTION public.update_category(
  _id UUID,
  _name TEXT,
  _parent_category_id UUID DEFAULT NULL,
  _default_visibility version_status DEFAULT 'approved'
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.categories
  SET name = _name,
      parent_category_id = _parent_category_id,
      default_visibility = _default_visibility
  WHERE id = _id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a category
CREATE OR REPLACE FUNCTION public.delete_category(_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.categories WHERE id = _id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve all categories
CREATE OR REPLACE FUNCTION public.get_categories()
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_category_id UUID,
  default_visibility version_status
) AS $$
BEGIN
  RETURN QUERY SELECT categories.id, categories.name, categories.parent_category_id, categories.default_visibility FROM public.categories;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
