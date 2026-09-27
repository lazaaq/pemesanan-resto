import { deleteMenuItemAction, updateMenuItemAction } from '@/app/admin/actions';
import { siteConfig } from '@/config/site';
import { SectionHeader } from '@/features/admin/components/admin-ui';
import { AddMenuDialog } from '@/features/admin/components/add-menu-dialog';
import { DeleteButton } from '@/features/admin/components/delete-button';
import { MenuItemForm } from '@/features/admin/components/menu-item-form';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CategoryRow = {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
};

type MenuItemRow = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    image_url: string | null;
    preparation_time_minutes: number;
    sort_order: number;
    is_available: boolean;
    is_featured: boolean;
    categoryIds: string[];
};

type MenuCategoryGroup = {
    id: string;
    name: string;
    items: MenuItemRow[];
};

function formatRupiah(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function getGradientFallback(seed: string) {
    const colors = [
        ['#f97316', '#fb923c'],
        ['#8b5cf6', '#a78bfa'],
        ['#ec4899', '#f472b6'],
        ['#14b8a6', '#2dd4bf'],
        ['#f59e0b', '#fbbf24'],
        ['#6366f1', '#818cf8'],
        ['#10b981', '#34d399'],
        ['#ef4444', '#f87171'],
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const [from, to] = colors[Math.abs(hash) % colors.length];
    return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

export default async function AdminMenusPage() {
    const supabase = await createServerSupabaseClient();
    const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('id').eq('slug', siteConfig.restaurantSlug).single();

    if (restaurantError || !restaurant) {
        throw restaurantError ?? new Error('Restaurant tidak ditemukan.');
    }

    const [{ data: categories, error: categoriesError }, { data: menuItems, error: menuItemsError }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, sort_order, is_active').eq('restaurant_id', restaurant.id).order('sort_order', { ascending: true }),
        supabase
            .from('menu_items')
            .select('id, name, slug, description, price, image_url, preparation_time_minutes, sort_order, is_available, is_featured')
            .eq('restaurant_id', restaurant.id)
            .order('sort_order', { ascending: true }),
    ]);

    if (categoriesError) throw categoriesError;
    if (menuItemsError) throw menuItemsError;

    const categoryRows: CategoryRow[] = (categories ?? []) as CategoryRow[];
    const menuItemRows = (menuItems ?? []) as Omit<MenuItemRow, 'categoryIds'>[];

    const { data: menuItemCategoryRows, error: menuItemCategoryError } = menuItemRows.length
        ? await supabase
              .from('menu_item_categories')
              .select('menu_item_id, category_id')
              .in(
                  'menu_item_id',
                  menuItemRows.map((item) => item.id),
              )
        : { data: [], error: null };

    if (menuItemCategoryError) throw menuItemCategoryError;

    const categoryLookup = new Map(categoryRows.map((category) => [category.id, category.name]));

    const enrichedMenuItems: MenuItemRow[] = menuItemRows.map((item) => ({
        ...item,
        categoryIds: (
            (menuItemCategoryRows ?? []) as Array<{
                menu_item_id: string;
                category_id: string;
            }>
        )
            .filter((relation) => relation.menu_item_id === item.id)
            .map((relation) => relation.category_id),
    }));

    const menuGroups: MenuCategoryGroup[] = [
        ...categoryRows.map((category) => ({
            id: category.id,
            name: category.name,
            items: enrichedMenuItems.filter((item) => item.categoryIds.includes(category.id)),
        })),
        {
            id: 'uncategorized',
            name: 'Tanpa kategori',
            items: enrichedMenuItems.filter((item) => item.categoryIds.length === 0),
        },
    ].filter((group) => group.items.length > 0);

    return (
        <section className="w-full space-y-6">
            <SectionHeader
                eyebrow="Menu"
                title="CRUD Makanan dan Minuman"
                description="Tambah item baru, ubah harga, urutan, ketersediaan, dan pilih satu atau beberapa kategori untuk setiap item."
            />

            {/* List Menu Items */}
            <div className="w-full space-y-6">
                <AddMenuDialog categories={categoryRows} />

                {menuGroups.length === 0 ? (
                    <div className="w-full bg-white py-6 text-sm" style={{ color: 'var(--admin-muted)' }}>
                        Belum ada menu yang ditambahkan.
                    </div>
                ) : (
                    menuGroups.map((group) => (
                        <section key={group.id} className="w-full space-y-3 border-t pt-6 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--admin-border)' }}>
                            <div className="flex items-end justify-between gap-3">
                                <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-foreground)' }}>
                                    {group.name}
                                </h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold" style={{ color: 'var(--admin-muted)' }}>
                                    {group.items.length} menu
                                </span>
                            </div>

                            <div className="w-full overflow-hidden bg-white" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                <div
                                    className="hidden grid-cols-[minmax(220px,1.4fr)_140px_120px_120px_100px] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wider md:grid"
                                    style={{
                                        borderColor: 'var(--admin-border)',
                                        color: 'var(--admin-muted)',
                                    }}
                                >
                                    <span>Menu</span>
                                    <span>Harga</span>
                                    <span>Status</span>
                                    <span>Featured</span>
                                    <span className="text-right">Action</span>
                                </div>

                                <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                                    {group.items.map((item) => (
                                        <details key={`${group.id}-${item.id}`} className="group">
                                            <summary className="grid cursor-pointer list-none gap-3 px-4 py-4 md:grid-cols-[64px_minmax(220px,1.4fr)_140px_120px_120px_100px] md:items-center [&::-webkit-details-marker]:hidden">
                                                <div
                                                    className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                                                    style={{ background: item.image_url ? undefined : getGradientFallback(item.name) }}
                                                >
                                                    {item.image_url && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--admin-foreground)' }}>
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs" style={{ color: 'var(--admin-muted)' }}>
                                                        {item.description || item.slug}
                                                    </p>
                                                    {item.categoryIds.length > 1 && (
                                                        <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--admin-muted)' }}>
                                                            {item.categoryIds
                                                                .map((categoryId) => categoryLookup.get(categoryId))
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: 'var(--admin-foreground)' }}>
                                                    {formatRupiah(item.price)}
                                                </span>
                                                <span
                                                    className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
                                                    style={{
                                                        background: item.is_available ? 'rgba(22,163,74,0.10)' : '#f1f5f9',
                                                        color: item.is_available ? '#15803d' : 'var(--admin-muted)',
                                                    }}
                                                >
                                                    {item.is_available ? 'Tersedia' : 'Nonaktif'}
                                                </span>
                                                <span className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                                                    {item.is_featured ? 'Featured' : '-'}
                                                </span>
                                                <span className="text-left md:text-right">
                                                    <span className="admin-btn-ghost inline-flex px-4 py-2 text-xs group-open:bg-slate-100">Edit</span>
                                                </span>
                                            </summary>

                                            <div className="bg-slate-50 px-4 pb-5 pt-1 space-y-2">
                                                <MenuItemForm
                                                    categories={categoryRows}
                                                    action={updateMenuItemAction}
                                                    submitLabel="Simpan menu"
                                                    header={{
                                                        title: 'Edit menu',
                                                    }}
                                                    initialValues={{
                                                        menuItemId: item.id,
                                                        name: item.name,
                                                        slug: item.slug,
                                                        price: item.price,
                                                        description: item.description ?? undefined,
                                                        preparationTimeMinutes: item.preparation_time_minutes,
                                                        sortOrder: item.sort_order,
                                                        imageUrl: item.image_url ?? undefined,
                                                        isAvailable: item.is_available,
                                                        isFeatured: item.is_featured,
                                                        categoryIds: item.categoryIds,
                                                    }}
                                                />

                                                <DeleteButton action={deleteMenuItemAction} itemId={item.id} label="Hapus menu" />
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))
                )}
            </div>
        </section>
    );
}
