import { css } from '@emotion/css';
import classNames from 'classnames';
import React, { cloneElement, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../domain/app/theme/Theme';
import { FCWithName } from '../../../types';
import styles from './breadcrumb.module.scss';
import BreadcrumbItem from './BreadcrumbItem';

type BreadcrumbProps = {
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
};

const Breadcrumb = ({
  ariaLabel,
  children,
  className,
}: BreadcrumbProps): React.ReactElement => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const items = React.Children.map(children, (child) => {
    /* istanbul ignore else */
    if (
      isValidElement(child) &&
      (child.type as FCWithName).componentName === 'BreadcrumbItem'
    ) {
      return cloneElement(child);
    }
  });

  return (
    <nav
      className={classNames(styles.breadcrumb, className)}
      aria-label={ariaLabel || t('common.breadcrumb')}
    >
      <ol className={classNames(styles.breadcrumbList, css(theme.breadcrumb))}>
        {items}
      </ol>
    </nav>
  );
};

Breadcrumb.Item = BreadcrumbItem;

export default Breadcrumb;