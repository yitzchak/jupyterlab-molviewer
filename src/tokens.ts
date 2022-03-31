import { IWidgetTracker } from '@jupyterlab/apputils';

import { IDocumentWidget } from '@jupyterlab/docregistry';

import { Token } from '@lumino/coreutils';

import { MolViewer } from './widget';

export interface IMolTracker
  extends IWidgetTracker<IDocumentWidget<MolViewer>> {}

export const IMolTracker = new Token<IMolTracker>(
  'jupyterlab-molviewer:IMolTracker'
);
