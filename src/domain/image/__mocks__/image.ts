import { MockedResponse } from '@apollo/client/testing';
import omit from 'lodash/omit';

import { PAGE_SIZE } from '../../../common/components/imageSelector/constants';
import { EMPTY_MULTI_LANGUAGE_OBJECT } from '../../../constants';
import {
  ImageDocument,
  ImagesDocument,
  UpdateImageDocument,
} from '../../../generated/graphql';
import generateAtId from '../../../utils/generateAtId';
import { fakeImage, fakeImages } from '../../../utils/mockDataUtils';
import { TEST_PUBLISHER_ID } from '../../organization/constants';
import { LICENSE_TYPES } from '../constants';

const imageId = 'image:1';
const imageAtId = generateAtId(imageId, 'image');
const publisher = TEST_PUBLISHER_ID;
const imageFields = {
  id: imageId,
  atId: imageAtId,
  altText: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: 'Image alt text' },
  license: LICENSE_TYPES.EVENT_ONLY,
  name: 'Image name',
  photographerName: 'Photographer name',
  publisher,
};
const image = fakeImage(imageFields);
const imageVariables = { createPath: undefined, id: imageId };
const imageResponse = { data: { image } };
const mockedImageResponse: MockedResponse = {
  request: { query: ImageDocument, variables: imageVariables },
  result: imageResponse,
};

const imageNotFoundId = 'not-found';
const imageNotFoundAtId = generateAtId(imageNotFoundId, 'image');
const imageNotFoundVariables = { createPath: undefined, id: imageNotFoundId };
const mockedImageNotFoundResponse = {
  request: {
    query: ImageDocument,
    variables: imageNotFoundVariables,
  },
  error: new Error('not found'),
};

const updateImageVariables = { input: omit(imageFields, 'atId') };
const updateImageResponse = { data: { updateImage: image } };
const mockedUpdateImageResponse: MockedResponse = {
  request: { query: UpdateImageDocument, variables: updateImageVariables },
  result: updateImageResponse,
};

const images = fakeImages(PAGE_SIZE, [image]);
const imagesVariables = {
  createPath: undefined,
  pageSize: PAGE_SIZE,
  publisher,
};
const imagesResponse = { data: { images } };
const mockedImagesResponse: MockedResponse = {
  request: { query: ImagesDocument, variables: imagesVariables },
  result: imagesResponse,
  newData: () => imagesResponse,
};

export {
  image,
  imageFields,
  imageNotFoundAtId,
  mockedImageNotFoundResponse,
  mockedImageResponse,
  mockedImagesResponse,
  mockedUpdateImageResponse,
};
