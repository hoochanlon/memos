'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { create } from '@orama/orama';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { createTokenizer } from '@orama/tokenizers/mandarin';

function initOrama() {
  return create({
    schema: { _: 'string' },
    // 配置中文分词器
    components: {
      tokenizer: createTokenizer(),
    },
  });
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n(); // (optional) for i18n
  // 获取 basePath，确保搜索 API 路径正确
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { search, setSearch, query } = useDocsSearch({
    type: 'static',
    initOrama,
    locale,
    // 指定搜索索引的 URL，包含 basePath
    from: `${basePath}/api/search`,
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}

